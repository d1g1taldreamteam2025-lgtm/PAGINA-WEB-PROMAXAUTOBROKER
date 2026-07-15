/* =====================================================================
   PROMAX — MEDICIÓN DE TRÁFICO (analytics propio + GA4/Clarity opcionales)
   ---------------------------------------------------------------------
   Registra en tu propia base (Supabase → tabla promax_analytics):
     · pageview  — cada visita a cada página (con referrer + UTM + device)
     · vehicle_view — qué carros miran (id del vehículo)
     · whatsapp / call — clics en WhatsApp y en llamar (conversión)
     · form      — envíos de formularios (contacto, financiamiento, sorteo)
     · lang      — cambios de idioma ES/EN
     · share     — botón compartir de la ficha
     · popup     — interacción con el popup de descuento
     · scroll    — profundidad de lectura (25/50/75/100%)
     · heat      — posición x/y de CADA clic → mapa de calor en el admin
   Anónimo (ids aleatorios, sin datos personales). No corre en /admin/.
   Además: si en config.js pones analytics.ga4 o analytics.clarity, carga
   Google Analytics 4 y/o Microsoft Clarity automáticamente.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = (window.PROMAX || {});
  var AN = CFG.analytics || {};
  var DB = CFG.db || {};
  if (AN.enabled === false) return;
  if (!DB.url || !DB.anonKey) return;
  if (/^\/admin\//.test(location.pathname)) return; // el panel no se mide

  // ---- Meta Pixel (Facebook/Instagram Ads) — opcional: solo si el cliente
  // pone su Pixel ID en config.analytics.metaPixel. Carga async (no frena el
  // render). Se inicializa ANTES de medir la primera visita para no perder
  // eventos. Abajo, en track(), reflejamos las conversiones clave como eventos
  // estándar de Meta (Lead/Contact/ViewContent) para que los anuncios del
  // cliente optimicen por resultados reales, no solo por clics. ----
  var FB_EVENTS = { whatsapp: "Contact", call: "Contact", form: "Lead", buy: "Lead", vehicle_view: "ViewContent" };
  if (AN.metaPixel) {
    try {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", String(AN.metaPixel));
      window.fbq("track", "PageView");
    } catch (e) {}
  }

  var ENDPOINT = DB.url.replace(/\/$/, "") + "/rest/v1/" + (AN.table || "promax_analytics");
  var PAGE = location.pathname + (location.search && /[?&](cat|id)=/.test(location.search) ? location.search : "");
  var DEVICE = (window.innerWidth || 1024) < 820 ? "mobile" : "desktop";

  function uid() {
    try { return crypto.randomUUID(); } catch (e) {}
    return "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  function store(area, key) {
    try { var v = area.getItem(key); if (!v) { v = uid(); area.setItem(key, v); } return v; } catch (e) { return uid(); }
  }
  var VISITOR = store(localStorage, "pmx_vid");
  var SESSION = store(sessionStorage, "pmx_sid");
  function lang() { try { return localStorage.getItem("pmx_lang") || (CFG.i18n && CFG.i18n.default) || "es"; } catch (e) { return "es"; } }

  // UTM: se capturan una vez por sesión (para saber qué campaña trajo la visita)
  var UTM = null;
  try {
    var qs = new URLSearchParams(location.search);
    var u = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) { if (qs.get(k)) u[k] = qs.get(k); });
    if (Object.keys(u).length) { sessionStorage.setItem("pmx_utm", JSON.stringify(u)); }
    UTM = JSON.parse(sessionStorage.getItem("pmx_utm") || "null");
  } catch (e) {}

  // ---- Cola con envío por lotes (no frena la página) ----
  var queue = [];
  var flushTimer = null;
  function send(rows, keepalive) {
    try {
      fetch(ENDPOINT, {
        method: "POST", keepalive: !!keepalive,
        headers: { apikey: DB.anonKey, Authorization: "Bearer " + DB.anonKey, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(rows),
      }).catch(function () {});
    } catch (e) {}
  }
  function flush(keepalive) {
    if (!queue.length) return;
    var rows = queue.splice(0, queue.length);
    send(rows, keepalive);
  }
  function track(event, meta) {
    queue.push({
      visitor_id: VISITOR, session_id: SESSION, event: event, page: PAGE,
      ref: event === "pageview" ? (document.referrer || "").slice(0, 300) : null,
      utm: event === "pageview" ? UTM : null,
      device: DEVICE, lang: lang(), meta: meta || null,
    });
    if (queue.length >= 20) { flush(false); return; }
    clearTimeout(flushTimer);
    flushTimer = setTimeout(function () { flush(false); }, 6000);
    // Espejo al Meta Pixel del cliente (si lo configuró): la misma conversión
    // que guardamos en tu base también se le reporta a Facebook como evento
    // estándar. PageView ya se disparó al iniciar el píxel, así que no se repite.
    if (window.fbq && FB_EVENTS[event]) { try { window.fbq("track", FB_EVENTS[event]); } catch (e) {} }
  }
  window.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(true); });
  window.addEventListener("pagehide", function () { flush(true); });
  // API pública para que otras partes del sitio registren eventos propios
  window.PMX = window.PMX || {};
  window.PMX.track = track;

  // ---- pageview (+ vehicle_view si es una ficha) ----
  track("pageview", { w: window.innerWidth, h: window.innerHeight });
  if (/^\/vehicle\//.test(location.pathname)) {
    try {
      var vid = new URLSearchParams(location.search).get("id");
      if (vid) track("vehicle_view", { vehicle_id: vid });
    } catch (e) {}
  }

  // ---- clics importantes + mapa de calor (delegación, un solo listener) ----
  var HEAT_MAX = 40; var heatCount = 0;
  document.addEventListener("click", function (ev) {
    try {
      var t = ev.target;
      // CTA: sube por el árbol buscando enlaces/botones con significado
      var el = t.closest ? t.closest("a,button,[data-track]") : null;
      if (el) {
        var href = el.getAttribute("href") || "";
        var dt = el.getAttribute("data-track");
        var label = (el.textContent || "").trim().slice(0, 60);
        if (dt) track(dt, { el: label });
        else if (/wa\.me|api\.whatsapp/.test(href)) track("whatsapp", { el: label });
        else if (/^tel:/.test(href)) track("call", { el: label });
        else if (/\/vehicle\/\?id=/.test(href)) { var m = href.match(/id=([^&]+)/); track("click", { what: "vehicle_card", vehicle_id: m ? decodeURIComponent(m[1]) : "" }); }
        else if (/\/financing\//.test(href)) track("click", { what: "financing", el: label });
      }
      // calor: posición relativa del clic (x/y en % de la página)
      if (heatCount < HEAT_MAX) {
        heatCount++;
        var doc = document.documentElement;
        var pageH = Math.max(doc.scrollHeight, 1);
        var x = Math.round(((ev.clientX || 0) / Math.max(window.innerWidth, 1)) * 100);
        var y = Math.round((((ev.clientY || 0) + (window.scrollY || 0)) / pageH) * 100);
        var tag = (t.tagName || "").toLowerCase() + (t.id ? "#" + t.id : "");
        track("heat", { x: x, y: y, el: tag.slice(0, 40) });
      }
    } catch (e) {}
  }, { capture: true, passive: true });

  // ---- LEADS: PMX.submitLead es el cuello de botella de TODOS los
  // formularios (contacto, financiamiento, newsletter, comprar, más info).
  // Lo envolvemos: cada lead queda medido con su tipo y su vehículo. ----
  function wrap(name, event, pick) {
    try {
      var orig = window.PMX && window.PMX[name];
      if (typeof orig !== "function") return;
      window.PMX[name] = function () {
        try { track(event, pick ? pick.apply(null, arguments) : null); flush(true); } catch (e) {}
        return orig.apply(this, arguments);
      };
    } catch (e) {}
  }
  wrap("submitLead", "form", function (p) { p = p || {}; return { type: p.form_type || "lead", vehicle_id: p.vehicle_id || null }; });
  wrap("buy", "click", function (v) { return { what: "buy", vehicle_id: (v && v.id) || null }; });
  wrap("moreInfo", "click", function (v) { return { what: "more_info", vehicle_id: (v && v.id) || null }; });
  wrap("share", "share", function (d) { return { title: ((d && d.title) || "").slice(0, 60) }; });

  // ---- cambio de idioma: site.js dispara el evento nativo 'pmx-lang' ----
  window.addEventListener("pmx-lang", function (e) {
    try { track("lang", { to: (e.detail && e.detail.lang) || lang() }); } catch (e2) {}
  });

  // ---- popup 15% OFF: apertura (clase is-open) + decisión ----
  // El popup lo monta site.js en DOMContentLoaded: reintentamos hasta verlo.
  var promoTries = 0;
  (function armPopup() {
    try {
      var promo = document.getElementById("pmxPromo");
      if (!promo) { if (++promoTries < 30) setTimeout(armPopup, 500); return; }
      if (!window.MutationObserver) return;
      var wasOpen = false;
      new MutationObserver(function () {
        var open = promo.classList.contains("is-open");
        if (open && !wasOpen) track("popup", { what: "open" });
        wasOpen = open;
      }).observe(promo, { attributes: true, attributeFilter: ["class"] });
      document.addEventListener("click", function (ev) {
        var t = ev.target.closest ? ev.target.closest("#pmxPromoYes,#pmxPromoNo,#pmxPromoX") : null;
        if (t) { track("popup", { what: t.id === "pmxPromoYes" ? "accept" : "dismiss" }); if (t.id === "pmxPromoYes") flush(true); }
      }, true);
    } catch (e) {}
  })();

  // ---- filtros del catálogo (categoría / condición / rápidos) ----
  document.addEventListener("click", function (ev) {
    try {
      var t = ev.target.closest ? ev.target.closest("[data-cat],[data-cond],[data-quick]") : null;
      if (!t) return;
      var kind = t.hasAttribute("data-cat") ? ["cat", t.getAttribute("data-cat")]
        : t.hasAttribute("data-cond") ? ["cond", t.getAttribute("data-cond")]
        : ["quick", t.getAttribute("data-quick")];
      track("filter", { kind: kind[0], value: String(kind[1] || "").slice(0, 40) });
    } catch (e) {}
  }, { capture: true, passive: true });

  // ---- envíos de formularios (respaldo por si algo no pasa por submitLead) ----
  document.addEventListener("submit", function (ev) {
    try {
      var f = ev.target;
      track("form_submit", { id: f.id || f.getAttribute("name") || "form" });
      flush(true); // el envío puede navegar: aseguramos que salga
    } catch (e) {}
  }, true);

  // ---- profundidad de scroll (25/50/75/100, una vez cada una) ----
  var marks = { 25: false, 50: false, 75: false, 100: false };
  window.addEventListener("scroll", function () {
    try {
      var doc = document.documentElement;
      var depth = Math.round(((window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100);
      [25, 50, 75, 100].forEach(function (m) {
        if (!marks[m] && depth >= m) { marks[m] = true; track("scroll", { depth: m }); }
      });
    } catch (e) {}
  }, { passive: true });

  // ---- GA4 + Microsoft Clarity (opcionales, solo si pones el ID en config) ----
  try {
    if (AN.ga4) {
      var g = document.createElement("script"); g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(AN.ga4);
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date()); window.gtag("config", AN.ga4);
    }
    if (AN.clarity) {
      (function (c, l, a, r, i) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        var s = l.createElement(r); s.async = 1; s.src = "https://www.clarity.ms/tag/" + i;
        var f = l.getElementsByTagName(r)[0]; f.parentNode.insertBefore(s, f);
      })(window, document, "clarity", "script", AN.clarity);
    }
  } catch (e) {}
})();
