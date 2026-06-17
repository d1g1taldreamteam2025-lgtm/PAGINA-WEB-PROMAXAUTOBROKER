/* =====================================================================
   PROMAX AUTO BROKER — MOTOR DEL SITIO (site.js)
   Inyecta header, footer y widgets; gestiona idioma (ES/EN) y formularios.
   Depende de /assets/js/config.js (window.PROMAX).
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.PROMAX || {};

  /* ---------------- IDIOMA ---------------- */
  function getLang() {
    try { var x = localStorage.getItem("pmx_lang"); if (x === "es" || x === "en") return x; } catch (e) {}
    return (CFG.i18n && CFG.i18n.default) || "es";
  }
  function setLang(l) {
    try { localStorage.setItem("pmx_lang", l); } catch (e) {}
    window.dispatchEvent(new CustomEvent("pmx-lang", { detail: { lang: l } }));
    applyI18n(l);
  }
  var LANG = getLang();

  // Diccionario global (las páginas pueden extenderlo con PMX.addTranslations)
  var DICT = { es: {}, en: {} };
  function addTranslations(obj) {
    ["es", "en"].forEach(function (l) {
      if (obj[l]) for (var k in obj[l]) DICT[l][k] = obj[l][k];
    });
  }
  function t(key) {
    return (DICT[LANG] && DICT[LANG][key] != null) ? DICT[LANG][key]
         : (DICT.es && DICT.es[key] != null ? DICT.es[key] : key);
  }
  function applyI18n(lang) {
    LANG = lang || LANG;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (DICT[LANG] && DICT[LANG][k] != null) el.innerHTML = DICT[LANG][k];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph");
      if (DICT[LANG] && DICT[LANG][k] != null) el.setAttribute("placeholder", DICT[LANG][k]);
    });
    document.querySelectorAll(".pmx-lang__btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === LANG);
    });
    document.documentElement.setAttribute("lang", LANG);
    updateWidgets(LANG);
  }

  /* ---------------- DICCIONARIO BASE (header/footer/widgets) ---------------- */
  addTranslations({
    es: {
      header_hours: CFG.contact ? CFG.contact.hoursShort : "",
      header_address: CFG.contact ? CFG.contact.address : "",
      cta_prequalify: "Pre-Calificar",
      nav_home: "Inicio", nav_inventory: "Inventario", nav_financing: "Financiamiento",
      nav_fin_overview: "Resumen de Financiamiento", nav_fin_apply: "Aplicar a Financiamiento",
      nav_about: "Nosotros", nav_contact: "Contacto", nav_faqs: "Preguntas",
      foot_tag: "Tu broker de autos de confianza: vehículos de calidad, precios honestos y financiamiento flexible.",
      foot_inventory: "Inventario", foot_view_all: "Ver Todo el Inventario",
      foot_under_20k: "Menos de $20k", foot_under_10k: "Menos de $10k",
      foot_resources: "Recursos", foot_apply: "Aplicar a Financiamiento",
      foot_about: "Nosotros", foot_contact: "Contacto", foot_faqs: "Preguntas Frecuentes",
      foot_newsletter: "Mantente en Contacto", foot_newsletter_sub: "Recibe ofertas y nuevas llegadas.",
      foot_subscribe: "Suscribirme", foot_subscribing: "Enviando...", foot_subscribed: "¡Suscrito!",
      foot_rights: "Todos los derechos reservados.",
      foot_privacy: "Política de Privacidad", foot_terms: "Términos de Uso",
      foot_sitemap: "Mapa del Sitio", foot_accessibility: "Accesibilidad",
      wa_msg: "Hola, quiero información para comprar un carro",
      chat_label: "Chat con Nosotros",
    },
    en: {
      header_hours: CFG.contact ? (CFG.contact.hoursShortEn || CFG.contact.hoursShort) : "",
      header_address: CFG.contact ? CFG.contact.address : "",
      cta_prequalify: "Get Pre-Qualified",
      nav_home: "Home", nav_inventory: "Inventory", nav_financing: "Financing",
      nav_fin_overview: "Financing Overview", nav_fin_apply: "Apply for Financing",
      nav_about: "About", nav_contact: "Contact Us", nav_faqs: "FAQs",
      foot_tag: "Your trusted auto broker: quality vehicles, honest pricing, and flexible financing.",
      foot_inventory: "Inventory", foot_view_all: "View All Inventory",
      foot_under_20k: "Under $20k", foot_under_10k: "Under $10k",
      foot_resources: "Resources", foot_apply: "Apply for Financing",
      foot_about: "About Us", foot_contact: "Contact Us", foot_faqs: "FAQs",
      foot_newsletter: "Stay in Touch", foot_newsletter_sub: "Get specials and new arrivals.",
      foot_subscribe: "Subscribe", foot_subscribing: "Sending...", foot_subscribed: "Subscribed!",
      foot_rights: "All rights reserved.",
      foot_privacy: "Privacy Policy", foot_terms: "Terms of Use",
      foot_sitemap: "Sitemap", foot_accessibility: "Accessibility",
      wa_msg: "Hi, I want information about buying a car",
      chat_label: "Chat with Us",
    },
  });

  /* ---------------- ICONOS SVG ---------------- */
  var IC = {
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.86s0 3.6-.07 4.86c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.86.07s-3.6 0-4.86-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.86c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.46 2.21 8.84 2.2 12 2.2m0 1.62c-3.14 0-3.51.01-4.75.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.39-.32-1.71a2.07 2.07 0 0 0-.69-1.06 2.07 2.07 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.75-.07m0 2.76a5.42 5.42 0 1 1 0 10.84 5.42 5.42 0 0 1 0-10.84m0 8.94a3.52 3.52 0 1 0 0-7.04 3.52 3.52 0 0 0 0 7.04m6.9-9.15a1.27 1.27 0 1 1-2.54 0 1.27 1.27 0 0 1 2.54 0"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.12-2.13C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.52A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.13c1.88.52 9.38.52 9.38.52s7.5 0 9.38-.52a3 3 0 0 0 2.12-2.13A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8M9.6 15.57V8.43L15.8 12l-6.2 3.57"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.3v12.93a2.59 2.59 0 0 1-2.59 2.49 2.59 2.59 0 0 1 0-5.18c.27 0 .52.04.77.12V9.99a5.9 5.9 0 0 0-.77-.05 5.87 5.87 0 1 0 5.87 5.87V9.01a7.56 7.56 0 0 0 4.4 1.41V7.12a4.28 4.28 0 0 1-3.33-1.3"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.5 23.5l1.64-6a11.5 11.5 0 1 1 4.86 4.86L.5 23.5M7.3 19.6l.4.24a9.6 9.6 0 1 0-3.3-3.3l.25.4-.92 3.37 3.57-.71m11.32-5.4c-.16-.27-.6-.43-1.25-.75-.65-.32-1.85-.91-2.14-1.02-.29-.1-.5-.16-.7.16-.21.32-.81 1.02-.99 1.23-.18.21-.36.24-.67.08a7.8 7.8 0 0 1-2.3-1.42 8.6 8.6 0 0 1-1.6-1.98c-.16-.29-.02-.44.14-.6.14-.14.32-.36.48-.54.16-.18.21-.3.32-.51.1-.21.05-.4-.03-.56-.08-.16-.7-1.7-.96-2.32-.25-.6-.5-.52-.7-.53-.18-.01-.39-.01-.6-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.62 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.44.21 1.99.13.6-.09 1.85-.76 2.11-1.49.26-.73.26-1.36.18-1.49"/></svg>',
    schedule: '<span class="material-icons-outlined">schedule</span>',
    place: '<span class="material-icons-outlined">place</span>',
    phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  };

  /* ---------------- NAV ---------------- */
  var NAV = [
    { href: "/", key: "nav_home" },
    { href: "/inventory/", key: "nav_inventory" },
    { href: "/financing/", key: "nav_financing", dropdown: true },
    { href: "/about/", key: "nav_about" },
    { href: "/contact/", key: "nav_contact" },
    { href: "/faqs/", key: "nav_faqs" },
  ];

  function langPills(extraClass) {
    return '<div class="pmx-lang ' + (extraClass || "") + '">' +
      '<button class="pmx-lang__btn" type="button" data-lang="es"><span>ES</span></button>' +
      '<button class="pmx-lang__btn" type="button" data-lang="en"><span>EN</span></button></div>';
  }

  function logoMarkup(opts) {
    opts = opts || {};
    var b = CFG.brand || {};
    var src = opts.light ? (b.logoLight || b.logo) : b.logo;
    var img = src
      ? '<img src="' + src + '" alt="' + (b.name || "") + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\';">'
      : "";
    var fallbackDisplay = src ? "none" : "inline";
    var txt = (b.logoText || "PROMAX").replace(/MAX/i, "<b>$&</b>");
    var style = "display:" + fallbackDisplay + (opts.light ? ";color:#fff" : "");
    return img + '<span class="pmx-nav__logo-text" style="' + style + '">' + txt + "</span>";
  }

  function buildHeader() {
    var c = CFG.contact || {};
    var navDesktop = NAV.map(function (n) {
      var caret = n.dropdown ? ' <span style="font-size:13px">▾</span>' : "";
      return '<a href="' + n.href + '" class="pmx-nav__item"><span data-i18n="' + n.key + '">' + t(n.key) + "</span>" + caret + "</a>";
    }).join("");

    var navMobile = NAV.map(function (n) {
      return '<a href="' + n.href + '"><span data-i18n="' + n.key + '">' + t(n.key) + "</span></a>";
    }).join("") +
      '<a href="/financing/apply/" class="pmx-mobilemenu__cta"><span data-i18n="cta_prequalify">' + t("cta_prequalify") + "</span></a>";

    var marqueeItems = ((CFG.marquee && CFG.marquee[LANG]) || []).map(function (txt) {
      return '<span class="pmx-marquee__item">★ ' + txt + '</span><span class="pmx-marquee__sep">●</span>';
    }).join("");
    var marqueeGroup = '<div class="pmx-marquee__group">' + marqueeItems + "</div>";

    return '' +
      '<div id="pmxSticky">' +
        // Top bar
        '<div class="pmx-topbar"><div class="pmx-topbar__inner">' +
          '<div class="pmx-topbar__info">' +
            '<span>' + IC.schedule + ' <span data-i18n="header_hours">' + t("header_hours") + '</span></span>' +
            '<span>' + IC.place + ' <span data-i18n="header_address">' + t("header_address") + '</span></span>' +
          '</div>' +
          '<div class="pmx-topbar__actions">' +
            langPills() +
            '<a class="pmx-topbar__cta" href="/financing/apply/"><span data-i18n="cta_prequalify">' + t("cta_prequalify") + '</span></a>' +
          '</div>' +
        '</div></div>' +
        // Desktop nav
        '<div class="pmx-nav"><div class="pmx-nav__inner">' +
          '<a href="/" class="pmx-nav__logo">' + logoMarkup() + '</a>' +
          navDesktop +
        '</div></div>' +
        // Mobile bar
        '<div class="pmx-mobilebar"><div class="pmx-mobilebar__inner">' +
          '<a href="/" class="pmx-mobilebar__logo">' + logoMarkup() + '</a>' +
          langPills() +
          '<button class="pmx-burger" type="button" aria-label="Menú" onclick="document.body.classList.toggle(\'pmx-open\')"><span class="material-icons-outlined" style="font-size:24px">menu</span></button>' +
        '</div></div>' +
        // Mobile menu
        '<div class="pmx-mobilemenu">' + navMobile + '</div>' +
        // Marquee
        '<section class="pmx-marquee"><div class="pmx-marquee__track">' + marqueeGroup + marqueeGroup + '</div></section>' +
      '</div>';
  }

  function buildFooter() {
    var s = CFG.social || {};
    var socialLinks = [
      ["instagram", s.instagram], ["facebook", s.facebook], ["youtube", s.youtube], ["tiktok", s.tiktok],
    ].filter(function (x) { return x[1]; })
     .map(function (x) { return '<a href="' + x[1] + '" target="_blank" rel="noopener" aria-label="' + x[0] + '">' + IC[x[0]] + "</a>"; })
     .join("");

    return '' +
      '<footer class="pmx-footer">' +
        '<div class="pmx-footer__top"><div class="pmx-footer__inner">' +
          '<div class="pmx-footer__col">' +
            '<a href="/" class="pmx-nav__logo">' + logoMarkup({ light: true }) + '</a>' +
            '<p class="pmx-footer__tag" style="margin-top:16px" data-i18n="foot_tag">' + t("foot_tag") + '</p>' +
            '<div class="pmx-footer__social">' + socialLinks + '</div>' +
          '</div>' +
          '<div class="pmx-footer__col">' +
            '<h4 data-i18n="foot_inventory">' + t("foot_inventory") + '</h4><ul>' +
              '<li><a href="/inventory/" data-i18n="foot_view_all">' + t("foot_view_all") + '</a></li>' +
              '<li><a href="/inventory/?filter=under-20k" data-i18n="foot_under_20k">' + t("foot_under_20k") + '</a></li>' +
              '<li><a href="/inventory/?filter=under-10k" data-i18n="foot_under_10k">' + t("foot_under_10k") + '</a></li>' +
            '</ul>' +
          '</div>' +
          '<div class="pmx-footer__col">' +
            '<h4 data-i18n="foot_resources">' + t("foot_resources") + '</h4><ul>' +
              '<li><a href="/financing/apply/" data-i18n="foot_apply">' + t("foot_apply") + '</a></li>' +
              '<li><a href="/about/" data-i18n="foot_about">' + t("foot_about") + '</a></li>' +
              '<li><a href="/contact/" data-i18n="foot_contact">' + t("foot_contact") + '</a></li>' +
              '<li><a href="/faqs/" data-i18n="foot_faqs">' + t("foot_faqs") + '</a></li>' +
            '</ul>' +
          '</div>' +
          '<div class="pmx-footer__col">' +
            '<h4 data-i18n="foot_newsletter">' + t("foot_newsletter") + '</h4>' +
            '<p data-i18n="foot_newsletter_sub">' + t("foot_newsletter_sub") + '</p>' +
            '<form class="pmx-news" id="pmxNewsletter">' +
              '<div class="pmx-news__wrap"><input type="email" placeholder="tu@email.com" data-i18n-ph="foot_email_ph" required></div>' +
              '<button type="submit"><span data-i18n="foot_subscribe">' + t("foot_subscribe") + '</span></button>' +
            '</form>' +
          '</div>' +
        '</div></div>' +
        '<div class="pmx-footer__bottom"><div class="pmx-footer__bottom-inner">' +
          '<p>© <span id="pmxYear"></span> ' + (CFG.brand ? CFG.brand.name : "") + '. <span data-i18n="foot_rights">' + t("foot_rights") + '</span></p>' +
          '<div class="pmx-footer__legal">' +
            '<a href="/privacy/" data-i18n="foot_privacy">' + t("foot_privacy") + '</a>' +
            '<a href="/terms/" data-i18n="foot_terms">' + t("foot_terms") + '</a>' +
            '<a href="/sitemap/" data-i18n="foot_sitemap">' + t("foot_sitemap") + '</a>' +
            '<a href="/accessibility/" data-i18n="foot_accessibility">' + t("foot_accessibility") + '</a>' +
          '</div>' +
        '</div></div>' +
      '</footer>';
  }

  function buildWidgets() {
    return '' +
      '<div class="pmx-fab" id="pmxFab">' +
        '<a href="#" class="pmx-fab__chat" id="pmxChat" target="_blank" rel="noopener">' +
          '<span class="pmx-fab__chat-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>' +
          '<span id="pmxChatLabel">' + t("chat_label") + '</span>' +
        '</a>' +
        '<a href="#" class="pmx-fab__wa" id="pmxWa" target="_blank" rel="noopener" aria-label="WhatsApp" style="color:#fff">' + IC.whatsapp + '</a>' +
      '</div>';
  }

  function updateWidgets() {
    var wa = CFG.contact ? CFG.contact.whatsapp : "";
    var url = "https://wa.me/" + wa + "?text=" + encodeURIComponent(t("wa_msg"));
    var chat = document.getElementById("pmxChat"), waBtn = document.getElementById("pmxWa"),
        label = document.getElementById("pmxChatLabel");
    if (chat) chat.setAttribute("href", url);
    if (waBtn) waBtn.setAttribute("href", url);
    if (label) label.textContent = t("chat_label");
  }

  /* ---------------- NEWSLETTER ---------------- */
  function wireNewsletter() {
    var f = document.getElementById("pmxNewsletter");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = f.querySelector("input"), btn = f.querySelector("button span") || f.querySelector("button");
      var email = (input.value || "").trim();
      if (!email) return;
      btn.textContent = t("foot_subscribing");
      submitLead({ form_type: "newsletter", email: email }).finally(function () {
        btn.textContent = t("foot_subscribed");
        input.value = "";
      });
    });
  }

  /* ---------------- ENVÍO DE LEADS ---------------- */
  function submitLead(payload) {
    payload._source_url = location.href;
    payload._submitted_at = new Date().toISOString();
    payload._lang = LANG;
    var url = (CFG.endpoints && CFG.endpoints.leadsWebhook) || "";
    if (!url) {
      console.info("[PROMAX] Lead (sin webhook configurado):", payload);
      return Promise.resolve({ simulated: true });
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }

  /* ---------------- IDIOMA: enlazar botones ---------------- */
  function wireLangButtons() {
    document.querySelectorAll(".pmx-lang__btn").forEach(function (b) {
      if (b.__wired) return; b.__wired = true;
      b.addEventListener("click", function (e) {
        e.preventDefault();
        setLang(b.getAttribute("data-lang"));
      });
    });
  }

  /* ---------------- INIT ---------------- */
  function mount() {
    // Header al inicio del body
    var headerHost = document.createElement("div");
    headerHost.innerHTML = buildHeader();
    document.body.insertBefore(headerHost.firstChild, document.body.firstChild);
    document.body.classList.add("pmx-mounted");

    // Footer + widgets al final (si la página no trae el suyo)
    if (!document.querySelector(".pmx-footer")) {
      var f = document.createElement("div"); f.innerHTML = buildFooter();
      document.body.appendChild(f.firstChild);
    }
    if (!document.getElementById("pmxFab")) {
      var w = document.createElement("div"); w.innerHTML = buildWidgets();
      document.body.appendChild(w.firstChild);
    }

    var y = document.getElementById("pmxYear");
    if (y) y.textContent = new Date().getFullYear();

    wireLangButtons();
    wireNewsletter();
    applyI18n(LANG);
  }

  // API pública
  window.PMX = {
    cfg: CFG,
    addTranslations: addTranslations,
    apply: applyI18n,
    lang: function () { return LANG; },
    setLang: setLang,
    submitLead: submitLead,
    t: t,
    money: function (n) { return "$" + (Number(n) || 0).toLocaleString("en-US"); },
    num: function (n) { return (Number(n) || 0).toLocaleString("en-US"); },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
