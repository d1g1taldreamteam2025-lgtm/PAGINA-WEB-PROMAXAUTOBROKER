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
    // PRIMERO se aplica el idioma (actualiza LANG) y DESPUÉS se avisa a las
    // páginas: así los listeners de 'pmx-lang' que llaman PMX.lang() (botones
    // de WhatsApp de /import/, /auction/, /carfax/…) leen el idioma NUEVO.
    applyI18n(l);
    window.dispatchEvent(new CustomEvent("pmx-lang", { detail: { lang: l } }));
  }
  var LANG = getLang();

  // Media query móvil compartida: las imágenes con data-i18n-src-m usan su
  // variante VERTICAL en celular y vuelven a la horizontal en pantalla grande.
  var MOBILE_MQ = window.matchMedia ? window.matchMedia("(max-width:768px)") : null;
  if (MOBILE_MQ && MOBILE_MQ.addEventListener) MOBILE_MQ.addEventListener("change", function () { applyI18n(LANG); });

  /* ---------------- CAMBIO DE IMAGEN SIN PANTALLAZO ----------------
     Cambiar el src de un <img> a lo bruto deja el hueco EN BLANCO/NEGRO
     mientras el navegador descarga la imagen nueva (queja del cliente al
     cambiar ES/EN). Aquí la descargamos primero en memoria y solo cuando ya
     está lista hacemos el cambio: la imagen vieja se queda visible hasta el
     último instante y el relevo es instantáneo. Si la nueva falla, se queda
     la vieja (mejor que un hueco roto). */
  function swapImgSmooth(el, url) {
    if (!url) return;
    // Marca de "lo último pedido": si el usuario alterna ES→EN→ES rápido, la
    // descarga vieja que llegue tarde NO debe pisar a la elección más reciente.
    el._pmxWant = url;
    if (el.getAttribute("src") === url) return;
    if (!el.getAttribute("src")) { el.setAttribute("src", url); return; } // primer pintado
    var im = new Image();
    im.onload = function () { if (el._pmxWant === url) el.setAttribute("src", url); };
    im.src = url;
    if (im.complete && el._pmxWant === url) el.setAttribute("src", url); // ya en caché
  }

  // Héroes bilingües declarados en el HTML con data-es / data-en (+ -m para
  // celular y data-ar / data-ar-m con su proporción para RESERVAR el alto
  // antes de que cargue la foto — sin saltos de página). El primer pintado lo
  // hace un mini-script inline junto a cada <img> (antes de que cargue este
  // archivo); aquí solo atendemos los cambios de idioma / tamaño de pantalla.
  function applyHeroImgs() {
    document.querySelectorAll("img[data-es][data-en]").forEach(function (el) {
      var m = MOBILE_MQ && MOBILE_MQ.matches;
      // Algunos pósters móviles ES miden distinto que los EN (948×1659 vs
      // 941×1672): data-ar-m-es declara la proporción ES para reservar exacto.
      var ar = m ? ((LANG === "es" && el.getAttribute("data-ar-m-es")) || el.getAttribute("data-ar-m"))
                 : el.getAttribute("data-ar");
      if (ar) el.style.aspectRatio = "auto " + ar; // 'auto' = manda la foto real al llegar
      swapImgSmooth(el, (m ? el.getAttribute("data-" + LANG + "-m") : null) || el.getAttribute("data-" + LANG));
    });
  }

  /* ---------------- PRECARGA DEL OTRO IDIOMA (cambio ES/EN instantáneo) ----------------
     Sin esto, al pulsar ES/EN el navegador recién descargaba las imágenes del
     otro idioma (pesadas) y el cambio se sentía trabado. Cuando la página ya
     terminó de cargar, calentamos la caché con esas imágenes en segundo plano. */
  function preloadLangImages() {
    try {
      var urls = [];
      var mob = MOBILE_MQ && MOBILE_MQ.matches;
      var other = (LANG === "en") ? "es" : "en";
      // 1) Imágenes por clave i18n (héroes de inventario/financiamiento, etc.)
      document.querySelectorAll("[data-i18n-src]").forEach(function (el) {
        var k = (mob && el.getAttribute("data-i18n-src-m")) || el.getAttribute("data-i18n-src");
        if (k && DICT[other] && DICT[other][k]) urls.push(DICT[other][k]);
      });
      // 2) Héroes bilingües (data-es/data-en y variantes -m de celular).
      //    SOLO <img>: el <video> de /nosotros/ también usa data-es/data-en y
      //    descargarlo como imagen desperdiciaba megas sin servir de nada.
      document.querySelectorAll("img[data-es],img[data-en]").forEach(function (el) {
        var u = (mob && el.getAttribute("data-" + other + "-m")) || el.getAttribute("data-" + other);
        if (u) urls.push(u);
      });
      // 3) Imagen del popup 15% (ambos idiomas, para que abra ya lista)
      if (DICT.es && DICT.es.promo_img) urls.push(DICT.es.promo_img);
      if (DICT.en && DICT.en.promo_img) urls.push(DICT.en.promo_img);
      urls.forEach(function (u) { var im = new Image(); im.decoding = "async"; im.src = u; });
    } catch (e) {}
  }
  // Antes esperaba 1.2s tras el load: si el visitante pulsaba EN apenas entrar,
  // la foto del otro idioma no estaba lista. Ahora arranca casi de inmediato.
  function schedulePreload() { setTimeout(preloadLangImages, 250); }
  if (document.readyState === "complete") schedulePreload();
  else window.addEventListener("load", schedulePreload);

  /* ---------------- CALENTAR LOS HÉROES DE LAS DEMÁS PÁGINAS ----------------
     Queja del cliente: al navegar de una página a otra, el banner llegaba en
     negro y la foto "aparecía de la nada". Cuando esta página ya terminó de
     cargar y el navegador está ocioso, descargamos en fila (una por una, sin
     ahogar la red) los banners de las OTRAS páginas en el idioma y tamaño
     actuales: al navegar, el banner sale de la caché al instante.
     ⚠️ Si cambias la foto de un héroe en cualquier página, actualiza su URL
     aquí también (mismas transformaciones de Cloudinary, o no hay caché). */
  var HERO_WARM = {
    d: { // PC (f_auto,q_auto,c_limit,w_1920)
      es: [
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784168155/ChatGPT_Image_Jul_15_2026_07_10_26_PM_yswyxb.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1783974149/Imagen_16.9_tu_aliado_espa%C3%B1_sawrrv.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784081959/ChatGPT_Image_Jul_14_2026_07_15_42_PM_zt23m8.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082243/ChatGPT_Image_Jul_14_2026_07_12_22_PM_evn6it.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784081912/ChatGPT_Image_Jul_14_2026_07_11_38_PM_kzjuco.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082034/ChatGPT_Image_Jul_14_2026_07_10_09_PM_y3c1op.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082200/ChatGPT_Image_Jul_14_2026_07_14_34_PM_tlmrbj.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082088/ChatGPT_Image_Jul_14_2026_07_14_22_PM_xfy6ap.png"
      ],
      en: [
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784168156/ChatGPT_Image_Jul_15_2026_07_11_11_PM_z5xxlb.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1783973283/ChatGPT_Image_13_jul_2026_15_07_00_xbclps.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784081958/ChatGPT_Image_Jul_14_2026_07_15_29_PM_m2y5xn.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082254/ChatGPT_Image_Jul_14_2026_07_12_07_PM_tabkr8.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784081914/ChatGPT_Image_Jul_14_2026_07_10_59_PM_ayfrph.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082045/ChatGPT_Image_Jul_14_2026_07_09_56_PM_ohbajv.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082197/ChatGPT_Image_Jul_14_2026_07_15_04_PM_ncn5ml.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1920/v1784082086/ChatGPT_Image_Jul_14_2026_07_14_14_PM_idjpdr.png"
      ]
    },
    m: { // celular (f_auto,q_auto,c_limit,w_1080)
      es: [
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1784168155/ChatGPT_Image_Jul_15_2026_07_11_36_PM_lsrg5m.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783801947/TU_ALI_9_hld4jj.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783865300/espa_9_glr0qv.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783801513/CONTACTANOS_9_16_kfuai0.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783801782/Preguntas_9_16_oo9aar.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783865142/subasta_9_sxmqw6.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783865048/9.16_espanol.16_espanol_fp59cy.png"
      ],
      en: [
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1784168156/ChatGPT_Image_Jul_15_2026_07_11_22_PM_hsteru.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783801946/YOUR_ALLI_9_rl0dtb.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783865298/ingle_9_vbmdlm.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783801513/Message_us_now_9_16_ukj4af.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783801782/Faq_9_16_t2sfde.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783865144/auction_9_vepjvo.png",
        "https://res.cloudinary.com/kcixfvoq/image/upload/f_auto,q_auto,c_limit,w_1080/v1783865048/ingles_9_hitzcl.png"
      ]
    }
  };
  function warmOtherHeroes() {
    try {
      if (navigator.connection && navigator.connection.saveData) return; // respeta ahorro de datos
      var list = HERO_WARM[(MOBILE_MQ && MOBILE_MQ.matches) ? "m" : "d"][LANG] || [];
      var i = 0;
      (function next() {
        if (i >= list.length) { warmInventoryThumbs(); return; } // luego, las fotos del catálogo
        var im = new Image();
        im.decoding = "async";
        if ("fetchPriority" in im) im.fetchPriority = "low";
        im.onload = im.onerror = function () { setTimeout(next, 150); };
        im.src = list[i++];
      })();
    } catch (e) {}
  }

  /* Precalienta las MINIATURAS que el catálogo va a mostrar de entrada.
     Gracias a la semilla de sesión (data.js), el orden "Variado" es idéntico
     en todas las páginas: aquí calculamos con PMX.diversify EXACTAMENTE las
     primeras tarjetas (Carros usados, la vista por defecto) y bajamos sus
     fotos en fila. Al entrar al inventario ya están en caché: 0ms a la vista.
     Solo corre en páginas que cargan data.js (home, catálogo, ficha). */
  function warmInventoryThumbs() {
    try {
      if (!window.PMX || !PMX.loadInventory || !PMX.diversify) return;
      PMX.loadInventory().then(function (cars) {
        var base = cars.filter(function (c) { return c.category === "cars" && c.condition !== "new"; });
        var first = PMX.diversify(base).slice(0, 12);
        var i = 0;
        (function next() {
          if (i >= first.length) return;
          var im = new Image();
          im.decoding = "async";
          if ("fetchPriority" in im) im.fetchPriority = "low";
          im.onload = im.onerror = function () { setTimeout(next, 120); };
          im.src = first[i].thumb || first[i].image; i++;
        })();
      }).catch(function () {});
    } catch (e) {}
  }
  function scheduleWarm() {
    if (window.requestIdleCallback) requestIdleCallback(warmOtherHeroes, { timeout: 4000 });
    else setTimeout(warmOtherHeroes, 2500);
  }
  if (document.readyState === "complete") scheduleWarm();
  else window.addEventListener("load", scheduleWarm);

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
    document.querySelectorAll("[data-i18n-src]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-src");
      // Variante vertical para celular (data-i18n-src-m), si la página la define
      var km = el.getAttribute("data-i18n-src-m");
      if (km && MOBILE_MQ && MOBILE_MQ.matches && DICT[LANG] && DICT[LANG][km] != null) k = km;
      if (DICT[LANG] && DICT[LANG][k] != null) swapImgSmooth(el, DICT[LANG][k]);
    });
    applyHeroImgs();
    document.querySelectorAll(".pmx-lang__btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === LANG);
    });
    document.documentElement.setAttribute("lang", LANG);
    var mtrack = document.querySelector(".pmx-marquee__track");
    if (mtrack) { mtrack.innerHTML = marqueeTrackHTML(LANG); fillTickers(); }
    updateWidgets(LANG);
    updateOpenStatus();
  }

  /* ---------------- DICCIONARIO BASE (header/footer/widgets) ---------------- */
  addTranslations({
    es: {
      header_hours: CFG.contact ? CFG.contact.hoursShort : "",
      header_address: CFG.contact ? CFG.contact.address : "",
      cta_prequalify: "Pre-Calificar",
      nav_home: "Inicio", nav_inventory: "Inventario", nav_financing: "Financiamiento",
      nav_fin_overview: "Resumen de Financiamiento", nav_fin_overview_sub: "Tasas, pasos y aliados", nav_fin_apply: "Aplicar a Financiamiento",
      nav_about: "Nosotros", nav_contact: "Contacto", nav_faqs: "Preguntas", nav_import: "Importación",
      nav_services: "Servicios",
      nav_import_full: "Importación a Venezuela", nav_import_sub: "USA → Venezuela, puerta a puerta",
      nav_auction: "Compra en Subasta", nav_auction_sub: "Acceso a subastas de dealers",
      nav_carfax: "Reporte CARFAX", nav_carfax_sub: "Historial completo por $15",
      foot_tag: "Tu broker de confianza en toda USA: vehículos, maquinaria y financiamiento flexible — y exportación a Venezuela.",
      foot_inventory: "Inventario", foot_view_all: "Ver Todo el Inventario",
      foot_under_20k: "Menos de $20k", foot_under_10k: "Menos de $10k",
      foot_resources: "Recursos", foot_apply: "Aplicar a Financiamiento", foot_import: "Importar a Venezuela",
      foot_auction: "Compra en Subasta", foot_carfax: "Reporte CARFAX ($15)",
      foot_about: "Nosotros", foot_contact: "Contacto", foot_faqs: "Preguntas Frecuentes",
      foot_newsletter: "Mantente en Contacto", foot_newsletter_sub: "Recibe ofertas y nuevas llegadas.",
      foot_subscribe: "Suscribirme", foot_subscribing: "Enviando...", foot_subscribed: "¡Suscrito!",
      foot_rights: "Todos los derechos reservados.",
      foot_privacy: "Política de Privacidad", foot_terms: "Términos de Uso",
      foot_sitemap: "Mapa del Sitio", foot_accessibility: "Accesibilidad",
      wa_msg: "Hola, quiero información para comprar un vehículo",
      chat_label: "Chat con Nosotros",
      open_now: "Abierto ahora", closed_now: "Cerrado",
      proof_action: "acaba de reservar", proof_verified: "Reserva verificada",
      promo_badge: "Solo para ti", promo_title: "Reclama tu 15% OFF",
      promo_img: "https://res.cloudinary.com/drbc4wbvw/image/upload/f_auto,q_auto,c_limit,w_900/v1783050699/15_OFF_ESPA_OL_mupupy.png",
      promo_sub: "Aplica hoy a tu financiamiento y recibe <b>15% de descuento</b> en tu primera compra.",
      promo_ends: "Tu descuento vence en", promo_h: "Horas", promo_m: "Min", promo_s: "Seg", promo_ms: "Ms",
      promo_yes: "Quiero mi descuento", promo_no: "No, gracias",
      promo_fine: "Aplica solo a nuevos clientes. No acumulable con otras promociones.",
    },
    en: {
      header_hours: CFG.contact ? (CFG.contact.hoursShortEn || CFG.contact.hoursShort) : "",
      header_address: CFG.contact ? CFG.contact.address : "",
      cta_prequalify: "Get Pre-Qualified",
      nav_home: "Home", nav_inventory: "Inventory", nav_financing: "Financing",
      nav_fin_overview: "Financing Overview", nav_fin_overview_sub: "Rates, steps & lenders", nav_fin_apply: "Apply for Financing",
      nav_about: "About", nav_contact: "Contact Us", nav_faqs: "FAQs", nav_import: "Import",
      nav_services: "Services",
      nav_import_full: "Import to Venezuela", nav_import_sub: "USA → Venezuela, door to door",
      nav_auction: "Buy at Auction", nav_auction_sub: "Dealer-only auction access",
      nav_carfax: "CARFAX Report", nav_carfax_sub: "Full history for $15",
      foot_tag: "Your trusted broker across the USA: vehicles, machinery and flexible financing — plus export to Venezuela.",
      foot_inventory: "Inventory", foot_view_all: "View All Inventory",
      foot_under_20k: "Under $20k", foot_under_10k: "Under $10k",
      foot_resources: "Resources", foot_apply: "Apply for Financing", foot_import: "Import to Venezuela",
      foot_auction: "Buy at Auction", foot_carfax: "CARFAX Report ($15)",
      foot_about: "About Us", foot_contact: "Contact Us", foot_faqs: "FAQs",
      foot_newsletter: "Stay in Touch", foot_newsletter_sub: "Get specials and new arrivals.",
      foot_subscribe: "Subscribe", foot_subscribing: "Sending...", foot_subscribed: "Subscribed!",
      foot_rights: "All rights reserved.",
      foot_privacy: "Privacy Policy", foot_terms: "Terms of Use",
      foot_sitemap: "Sitemap", foot_accessibility: "Accessibility",
      wa_msg: "Hi, I want information about buying a vehicle",
      chat_label: "Chat with Us",
      open_now: "Open now", closed_now: "Closed",
      proof_action: "just reserved", proof_verified: "Verified reservation",
      promo_badge: "Just for you", promo_title: "Claim your 15% OFF",
      promo_img: "https://res.cloudinary.com/drbc4wbvw/image/upload/f_auto,q_auto,c_limit,w_900/v1783050716/15_OFF_ENGLHISH_boybwo.png",
      promo_sub: "Apply for financing today and get <b>15% off</b> your first purchase.",
      promo_ends: "Your discount expires in", promo_h: "Hours", promo_m: "Min", promo_s: "Sec", promo_ms: "Ms",
      promo_yes: "I want my discount", promo_no: "No, thanks",
      promo_fine: "New clients only. Not combinable with other promotions.",
    },
  });

  /* ---------------- CATEGORÍAS DEL CATÁLOGO ---------------- */
  function catList() { return CFG.categories || []; }
  function catBy(slug) { return catList().filter(function (c) { return c.slug === slug; })[0] || null; }
  function catLabel(slug) { var c = catBy(slug); return c ? (LANG === "en" ? c.en : c.es) : slug; }
  function catIcon(slug) { var c = catBy(slug); return c ? c.icon : "🚗"; }

  // Íconos SVG propios por categoría: se ven IGUAL en todos los equipos
  // (los emojis fallan según el sistema — p. ej. cuadritos en Windows).
  var CAT_SVG = {
    cars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.3 16.3H3a1 1 0 0 1-1-1v-2.2a1.6 1.6 0 0 1 1.2-1.55L5.4 11l1.9-3.1A2 2 0 0 1 9 7h4.6a2 2 0 0 1 1.6.8L17.4 11l3.4.85A1.6 1.6 0 0 1 22 13.4v1.9a1 1 0 0 1-1 1h-1.3"/><path d="M9.3 16.3h5.4"/><path d="M5.4 11h12"/><path d="M11.8 7v4"/><circle cx="6.9" cy="16.3" r="2.1"/><circle cx="17.1" cy="16.3" r="2.1"/></svg>',
    trucks_machinery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15.8V7a1.4 1.4 0 0 1 1.4-1.4h8.4A1.4 1.4 0 0 1 13.2 7v8.8"/><path d="M13.2 9h3.9c.4 0 .8.17 1.06.47l2.44 2.83c.26.3.4.67.4 1.06v1.44a1 1 0 0 1-1 1h-.9"/><path d="M11.1 15.8h2.1M2 15.8h1.8"/><path d="M8.2 15.8h.7"/><path d="M17 9v3.5h3.8"/><circle cx="6" cy="16.6" r="2.1"/><circle cx="16.9" cy="16.6" r="2.1"/></svg>',
    vans: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 15.8V8a2 2 0 0 1 2-2h9c.62 0 1.2.29 1.58.78l3.1 4.02 2.05.7a1.6 1.6 0 0 1 1.27 1.56v1.74a1 1 0 0 1-1 1h-1.2"/><path d="M13.9 6l.1 4.9h4.2"/><path d="M2.5 10.9h11.5"/><path d="M2.5 15.8h1.9m4.3 0h6.1"/><circle cx="6.6" cy="16.5" r="2.1"/><circle cx="17" cy="16.5" r="2.1"/></svg>',
    motorcycles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.4" cy="16.8" r="2.9"/><circle cx="18.6" cy="16.8" r="2.9"/><path d="M8.3 16.8h6l2.2-4.9 2.1 4.9"/><path d="M16.5 11.9 14.6 7.8h-2.4l-1 1.6"/><path d="M8.3 16.8 5.9 11l-2.5-.6"/><path d="M5.9 11l3.5-.8 4 1.7h3.1"/></svg>',
    utv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.2" cy="16.6" r="2.6"/><circle cx="17.8" cy="16.6" r="2.6"/><path d="M8.8 16.6h6.4"/><path d="M2.6 13.4 4.4 10h6.4l1.9 3.4h8.7"/><path d="M6.4 10V6.4h7.2l2.2 3.6"/><path d="M9.8 6.4V10"/><path d="M2.6 13.4v1.6M21.4 13.4v1.3"/></svg>',
    watercraft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 15.6 6.6 12h4.9l2.4 2.2h4.6c.66 0 1 .8.53 1.26l-1.63 1.64H4.6z"/><path d="M9.6 12 8.2 8.6h2.8l2.1 3.4"/><path d="M8.2 8.6 10.7 6.8"/><path d="M2 19.8c1.9 1.3 3.9 1.3 5.8 0s3.9-1.3 5.8 0 3.9 1.3 5.8 0"/></svg>',
  };
  function catSvg(slug) { return CAT_SVG[slug] || CAT_SVG.cars; }

  // Claves i18n dinámicas (cat_<slug>) + textos de acciones/compartir/sorteo
  (function () {
    var es = { cat_all: "Ver todo el catálogo" }, en = { cat_all: "View full catalog" };
    catList().forEach(function (c) { es["cat_" + c.slug] = c.es; en["cat_" + c.slug] = c.en; });
    var rf = CFG.referrals || {};
    es.raffle_txt = "<b>¡Participa en nuestro sorteo!</b> " + (rf.prizeES || "");
    en.raffle_txt = "<b>Join our giveaway!</b> " + (rf.prizeEN || rf.prizeES || "");
    // Versión CORTA para móvil (cabe en una sola línea, sin recortes)
    es.raffle_short = "<b>¡Gana $500 por referir!</b>";
    en.raffle_short = "<b>Earn $500 per referral!</b>";
    es.raffle_cta = "Participar"; en.raffle_cta = "Enter now";
    // Ticker GRANDE (franja del sorteo en movimiento)
    es.raffle_big1 = "🎁 ¡GANA <b>$500</b> POR CADA REFERIDO!";
    es.raffle_big2 = "PARTICIPA POR UN <b>TOYOTA COROLLA 2026</b> 🚗";
    es.raffle_big3 = "TOCA AQUÍ PARA PARTICIPAR →";
    en.raffle_big1 = "🎁 EARN <b>$500</b> PER REFERRAL!";
    en.raffle_big2 = "ENTER TO WIN A <b>2026 TOYOTA COROLLA</b> 🚗";
    en.raffle_big3 = "TAP HERE TO ENTER →";
    es.act_buy = "Comprar"; en.act_buy = "Buy now";
    es.act_share = "Compartir"; en.act_share = "Share";
    es.act_finance = "Financiar"; en.act_finance = "Finance";
    es.act_moreinfo = "Más info"; en.act_moreinfo = "More info";
    es.share_title = "Compartir este vehículo"; en.share_title = "Share this vehicle";
    es.share_wa = "WhatsApp"; en.share_wa = "WhatsApp";
    es.share_fb = "Facebook"; en.share_fb = "Facebook";
    es.share_copy = "Copiar enlace"; en.share_copy = "Copy link";
    es.share_copied = "¡Enlace copiado!"; en.share_copied = "Link copied!";
    es.share_close = "Cerrar"; en.share_close = "Close";
    addTranslations({ es: es, en: en });
  })();

  /* ---------------- ICONOS SVG ---------------- */
  var IC = {
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.86s0 3.6-.07 4.86c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.86.07s-3.6 0-4.86-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.86c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.46 2.21 8.84 2.2 12 2.2m0 1.62c-3.14 0-3.51.01-4.75.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.39-.32-1.71a2.07 2.07 0 0 0-.69-1.06 2.07 2.07 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.75-.07m0 2.76a5.42 5.42 0 1 1 0 10.84 5.42 5.42 0 0 1 0-10.84m0 8.94a3.52 3.52 0 1 0 0-7.04 3.52 3.52 0 0 0 0 7.04m6.9-9.15a1.27 1.27 0 1 1-2.54 0 1.27 1.27 0 0 1 2.54 0"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.12-2.13C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.52A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.13c1.88.52 9.38.52 9.38.52s7.5 0 9.38-.52a3 3 0 0 0 2.12-2.13A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8M9.6 15.57V8.43L15.8 12l-6.2 3.57"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.3v12.93a2.59 2.59 0 0 1-2.59 2.49 2.59 2.59 0 0 1 0-5.18c.27 0 .52.04.77.12V9.99a5.9 5.9 0 0 0-.77-.05 5.87 5.87 0 1 0 5.87 5.87V9.01a7.56 7.56 0 0 0 4.4 1.41V7.12a4.28 4.28 0 0 1-3.33-1.3"/></svg>',
    whatsapp: '<svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 357.7l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>',
    schedule: '<span class="material-icons-outlined">schedule</span>',
    place: '<span class="material-icons-outlined">place</span>',
    phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  };

  /* ---------------- NAV ---------------- */
  var NAV = [
    { href: "/", key: "nav_home" },
    { href: "/inventory/", key: "nav_inventory" },
    // "Servicios": agrupa Importación + Subasta + CARFAX (el clic directo
    // lleva a /import/, el negocio principal; el hover muestra los tres).
    { href: "/import/", key: "nav_services", services: true },
    { href: "/financing/", key: "nav_financing", dropdown: true },
    { href: "/about/", key: "nav_about" },
    { href: "/contact/", key: "nav_contact" },
    { href: "/faqs/", key: "nav_faqs" }
  ];

  // Sub-enlaces del menú "Servicios" (desktop: dropdown; móvil: lista indentada)
  var SERVICES = [
    { href: "/import/", key: "nav_import_full", sub: "nav_import_sub" },
    { href: "/auction/", key: "nav_auction", sub: "nav_auction_sub" },
    { href: "/carfax/", key: "nav_carfax", sub: "nav_carfax_sub" }
  ];

  function langPills(extraClass) {
    var fl = CFG.flags || {};
    var fes = fl.es ? '<img src="' + fl.es + '" alt="ES">' : "";
    var fen = fl.en ? '<img src="' + fl.en + '" alt="EN">' : "";
    return '<div class="pmx-lang ' + (extraClass || "") + '">' +
      '<button class="pmx-lang__btn" type="button" data-lang="es">' + fes + '<span>ES</span></button>' +
      '<button class="pmx-lang__btn" type="button" data-lang="en">' + fen + '<span>EN</span></button></div>';
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

  // Las cintas en movimiento (sorteo y marquee) animan la MITAD de la pista
  // (translateX(-50%)); esa mitad debe cubrir el ancho de la pantalla o queda
  // un HUECO vacío al final de cada ciclo (pasaba en monitores anchos).
  // Clonamos el grupo en PARES (así -50% sigue cayendo exacto en el borde de
  // un grupo y el bucle no salta) hasta cubrir de sobra cualquier pantalla.
  function fillTickers() {
    [".pmx-raffle__track", ".pmx-marquee__track"].forEach(function (sel) {
      var tr = document.querySelector(sel);
      var g = tr && tr.firstElementChild;
      if (!g) return;
      var safety = 0;
      while (tr.scrollWidth < window.innerWidth * 2 + 20 && safety++ < 10) {
        tr.appendChild(g.cloneNode(true));
        tr.appendChild(g.cloneNode(true));
      }
    });
  }

  function marqueeTrackHTML(lang) {
    var items = ((CFG.marquee && CFG.marquee[lang]) || (CFG.marquee && CFG.marquee.es) || []).map(function (txt) {
      return '<span class="pmx-marquee__item">★ ' + txt + '</span><span class="pmx-marquee__sep">●</span>';
    }).join("");
    var group = '<div class="pmx-marquee__group">' + items + "</div>";
    return group + group;
  }

  function buildHeader() {
    var c = CFG.contact || {};
    var navDesktop = NAV.map(function (n) {
      if (n.key === "nav_inventory" && catList().length) {
        // Dropdown de categorías (Carros, Camiones, Vans, Motos, UTV, Motos de agua)
        var catLinks = catList().map(function (cc) {
          return '<a href="/inventory/?cat=' + cc.slug + '"><span class="pmx-cati pmx-cati--sm">' + catSvg(cc.slug) + '</span> <span data-i18n="cat_' + cc.slug + '">' + t("cat_" + cc.slug) + '</span></a>';
        }).join("");
        return '<div class="pmx-nav__dd-wrap" data-dd>' +
          '<a href="' + n.href + '" class="pmx-nav__item" data-dd-trigger><span data-i18n="' + n.key + '">' + t(n.key) + '</span> <span class="pmx-caret">▾</span></a>' +
          '<div class="pmx-nav__dd">' + catLinks +
            '<a href="/inventory/" class="pmx-nav__dd-cta"><span data-i18n="cat_all">' + t("cat_all") + '</span></a>' +
          '</div>' +
        '</div>';
      }
      if (n.services) {
        // Dropdown "Servicios": Importación a Venezuela / Compra en Subasta / CARFAX
        var svcLinks = SERVICES.map(function (sv) {
          return '<a href="' + sv.href + '"><span data-i18n="' + sv.key + '">' + t(sv.key) + '</span><div class="pmx-nav__dd-sub" data-i18n="' + sv.sub + '">' + t(sv.sub) + '</div></a>';
        }).join("");
        return '<div class="pmx-nav__dd-wrap" data-dd>' +
          '<a href="' + n.href + '" class="pmx-nav__item" data-dd-trigger><span data-i18n="' + n.key + '">' + t(n.key) + '</span> <span class="pmx-caret">▾</span></a>' +
          '<div class="pmx-nav__dd">' + svcLinks + '</div>' +
        '</div>';
      }
      if (n.dropdown) {
        return '<div class="pmx-nav__dd-wrap" data-dd>' +
          '<a href="' + n.href + '" class="pmx-nav__item" data-dd-trigger><span data-i18n="' + n.key + '">' + t(n.key) + '</span> <span class="pmx-caret">▾</span></a>' +
          '<div class="pmx-nav__dd">' +
            '<a href="/financing/"><span data-i18n="nav_fin_overview">' + t("nav_fin_overview") + '</span><div class="pmx-nav__dd-sub" data-i18n="nav_fin_overview_sub">' + t("nav_fin_overview_sub") + '</div></a>' +
            '<a href="/financing/apply/" class="pmx-nav__dd-cta"><span data-i18n="nav_fin_apply">' + t("nav_fin_apply") + '</span></a>' +
          '</div>' +
        '</div>';
      }
      return '<a href="' + n.href + '" class="pmx-nav__item"><span data-i18n="' + n.key + '">' + t(n.key) + "</span></a>";
    }).join("");

    var navMobile = NAV.map(function (n) {
      if (n.services) {
        // En móvil los 3 servicios van como enlaces directos (sin submenú)
        return SERVICES.map(function (sv) {
          return '<a href="' + sv.href + '"><span data-i18n="' + sv.key + '">' + t(sv.key) + '</span></a>';
        }).join("");
      }
      var out = '<a href="' + n.href + '"><span data-i18n="' + n.key + '">' + t(n.key) + "</span></a>";
      if (n.key === "nav_inventory" && catList().length) {
        out += catList().map(function (cc) {
          return '<a href="/inventory/?cat=' + cc.slug + '" style="padding-left:26px;font-weight:500;font-size:14px"><span class="pmx-cati pmx-cati--sm">' + catSvg(cc.slug) + '</span> <span data-i18n="cat_' + cc.slug + '">' + t("cat_" + cc.slug) + '</span></a>';
        }).join("");
      }
      return out;
    }).join("") +
      '<a href="/financing/apply/" class="pmx-mobilemenu__cta"><span data-i18n="cta_prequalify">' + t("cta_prequalify") + "</span></a>";

    var marqueeGroup = marqueeTrackHTML(LANG);

    return '' +
      '<div id="pmxSticky">' +
        buildRaffle() +
        // Top bar
        '<div class="pmx-topbar"><div class="pmx-topbar__inner">' +
          '<div class="pmx-topbar__info">' +
            '<span>' + IC.schedule + ' <span data-i18n="header_hours">' + t("header_hours") + '</span> <span class="pmx-openstatus" id="pmxOpenStatus"></span></span>' +
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
        '<section class="pmx-marquee"><div class="pmx-marquee__track">' + marqueeGroup + '</div></section>' +
      '</div>';
  }

  function buildFooter() {
    var s = CFG.social || {};
    var socialLinks = [
      ["instagram", s.instagram], ["facebook", s.facebook], ["youtube", s.youtube], ["tiktok", s.tiktok]
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
              '<li><a href="/import/" data-i18n="foot_import">' + t("foot_import") + '</a></li>' +
              '<li><a href="/auction/" data-i18n="foot_auction">' + t("foot_auction") + '</a></li>' +
              '<li><a href="/carfax/" data-i18n="foot_carfax">' + t("foot_carfax") + '</a></li>' +
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
    var waLogo = CFG.brand && CFG.brand.whatsappLogo;
    var waIcon = waLogo
      ? '<img src="' + waLogo + '" alt="WhatsApp" onerror="this.style.display=\'none\'">'
      : IC.whatsapp;
    return '' +
      '<div class="pmx-fab" id="pmxFab">' +
        '<a href="#" class="pmx-fab__chat" id="pmxChat" target="_blank" rel="noopener">' +
          '<span class="pmx-fab__chat-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>' +
          '<span id="pmxChatLabel">' + t("chat_label") + '</span>' +
        '</a>' +
        '<a href="#" class="pmx-fab__wa" id="pmxWa" target="_blank" rel="noopener" aria-label="WhatsApp">' + waIcon + '</a>' +
      '</div>';
  }

  // Enlace de WhatsApp con firma de origen: el dueño SIEMPRE sabe que el
  // mensaje llegó desde la página web (pedido expreso del cliente).
  function waOriginLine() {
    return LANG === "en" ? "— I'm coming from your website" : "— Vengo de su página web";
  }
  function waUrl(msg) {
    var m = (msg || t("wa_msg")) + "\n" + waOriginLine();
    return "https://wa.me/" + (CFG.contact ? CFG.contact.whatsapp : "") + "?text=" + encodeURIComponent(m);
  }

  function updateWidgets() {
    var url = waUrl();
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
      submitLead({ form_type: "newsletter", email: email, message: "📧 Nueva suscripción al boletín (ofertas y nuevas llegadas)" })
        .catch(function () {})
        .finally(function () {
          btn.textContent = t("foot_subscribed");
          input.value = "";
        });
    });
  }

  /* ---------------- ENVÍO DE LEADS ---------------- */
  // fetch con tiempo límite: si una integración está lenta o caída, abortamos
  // para que el formulario NUNCA se quede "colgado" esperando una respuesta.
  function fetchWithTimeout(url, opts, ms) {
    opts = opts || {};
    var ctrl, timer;
    try { ctrl = new AbortController(); opts.signal = ctrl.signal; } catch (e) {}
    var clear = function () { if (timer) { clearTimeout(timer); timer = null; } };
    timer = setTimeout(function () { try { ctrl && ctrl.abort(); } catch (e) {} }, ms || 8000);
    return fetch(url, opts).then(
      function (r) { clear(); return r; },
      function (e) { clear(); throw e; }
    );
  }

  // Guarda el lead en Supabase (alimenta el panel de leads). Devuelve una promesa
  // que resuelve true si quedó guardado y false si no, sin lanzar errores.
  function insertInquiry(payload) {
    var db = CFG.db || {};
    if (!db.url || !db.anonKey || !db.inquiriesTable) return Promise.resolve(false);
    var row = {
      form_type: payload.form_type || payload.action_type || "contact",
      name: payload.name || payload.full_name || null,
      email: payload.email || null,
      phone: payload.phone || null,
      vehicle_title: payload.vehicle_title || payload.vehicle || null,
      vehicle_id: payload.vehicle_id || payload.vin || payload.id || null,
      message: payload.message || payload.comments || payload.comment || null,
      source_url: payload._source_url || location.href,
      status: "new",
      raw: payload,
    };
    return fetchWithTimeout(db.url + "/rest/v1/" + db.inquiriesTable, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": db.anonKey,
        "Authorization": "Bearer " + db.anonKey,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(row),
      keepalive: true,
    }, 8000).then(function (r) { return !!(r && r.ok); }).catch(function () { return false; });
  }

  // Envía el lead. El mensaje de éxito NO depende del webhook de notificación
  // (n8n): basta con que el lead quede guardado en Supabase. Así el cliente
  // SIEMPRE recibe confirmación aunque la automatización esté lenta o caída.
  function submitLead(payload) {
    payload._source_url = location.href;
    payload._submitted_at = new Date().toISOString();
    payload._lang = LANG;

    // 1) Guardar SIEMPRE en Supabase (registro principal del lead).
    var saved = insertInquiry(payload);

    // 2) Notificar por WhatsApp/email vía n8n (best-effort, con tiempo límite).
    var url = (CFG.endpoints && CFG.endpoints.leadsWebhook) || "";
    var notified = url
      ? fetchWithTimeout(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }, 8000).then(function (r) { return !!(r && r.ok); }).catch(function () { return false; })
      : Promise.resolve(false);

    // Éxito apenas Supabase confirme (rápido). Si Supabase fallara, esperamos al
    // webhook como respaldo. Solo si NINGUNO responde mostramos error.
    return saved.then(function (ok) {
      if (ok) return { saved: true };
      return notified.then(function (n) {
        if (n) return { saved: false, notified: true };
        throw new Error("lead_not_delivered");
      });
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

  /* ---------------- MENÚS DESPLEGABLES (Inventario / Financiamiento) ---------------- */
  // Desktop: se abren al PASAR el mouse y se cierran solos al quitarlo — nunca
  // quedan "pegados" tapando el contenido. El clic en el enlace navega normal.
  var ddDocWired = false;
  function wireDropdown() {
    document.querySelectorAll("[data-dd]").forEach(function (wrap) {
      var trigger = wrap.querySelector("[data-dd-trigger]");
      if (!trigger || trigger.__dd) return; trigger.__dd = true;
      var closeT = null;
      function openDD() {
        if (closeT) { clearTimeout(closeT); closeT = null; }
        document.querySelectorAll("[data-dd].open").forEach(function (w) { if (w !== wrap) w.classList.remove("open"); });
        wrap.classList.add("open");
      }
      function closeDD() {
        closeT = setTimeout(function () { wrap.classList.remove("open"); }, 160);
      }
      wrap.addEventListener("mouseenter", function () {
        if (window.matchMedia("(min-width:1025px)").matches) openDD();
      });
      wrap.addEventListener("mouseleave", closeDD);
      trigger.addEventListener("click", function (e) {
        if (window.matchMedia("(max-width:1024px)").matches) return; // en móvil usa el menú hamburguesa
        // Pantallas táctiles grandes: el primer toque abre, el segundo navega.
        if (!wrap.classList.contains("open")) { e.preventDefault(); openDD(); }
      });
    });
    if (!ddDocWired) {
      ddDocWired = true;
      document.addEventListener("click", function (e) {
        if (e.target.closest("[data-dd]")) return;
        document.querySelectorAll("[data-dd].open").forEach(function (w) { w.classList.remove("open"); });
      });
    }
  }

  /* ---------------- ANIMACIONES ---------------- */
  function wireCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    function run(el) {
      var raw = el.getAttribute("data-count");
      var target = parseFloat(raw) || 0;
      var dec = raw.indexOf(".") > -1 ? 1 : 0;
      var pre = el.getAttribute("data-pre") || "", suf = el.getAttribute("data-suf") || "";
      var dur = 1400, start = null;
      // Los decimales (ej. calificación 4.9) arrancan cerca del final para NO
      // mostrar por un instante un número alarmante como "2.2★".
      var base = dec ? target * 0.85 : 0;
      function fmt(v) { return pre + (dec ? v.toFixed(1) : Math.floor(v).toLocaleString("en-US")) + suf; }
      function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(base + (target - base) * e); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target); }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }); }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  // Selectores que reciben la animación de entrada (fade-in-up) al hacer scroll
  var REVEAL_SEL = ".pmx-reveal,.pmx-section__head,.pmx-ctacard,.pmx-why__item,.pmx-review,.pmx-step,.pmx-stats__item,.pmx-card,.pmx-lender-item,.pmx-vcard,.pmx-logowall__item,.fin-step";
  var revealIO = null;
  // Asigna un retraso en cadena a los hermanos del mismo padre (efecto escalonado)
  function applyStagger(els) {
    var byParent = (typeof Map !== "undefined") ? new Map() : null;
    if (!byParent) return;
    els.forEach(function (el) {
      var p = el.parentNode, i = byParent.get(p) || 0;
      byParent.set(p, i + 1);
      if (i > 0) el.style.transitionDelay = (Math.min(i, 8) * 0.07).toFixed(2) + "s";
    });
  }
  // Aplica reveals a un contenedor (sirve también para contenido inyectado luego, ej. inventario)
  function revealScan(root) {
    document.documentElement.classList.add("pmx-js");
    root = root || document;
    var els = Array.prototype.slice.call(root.querySelectorAll(REVEAL_SEL)).filter(function (el) {
      return !el.classList.contains("pmx-reveal") && !el.closest("#pmxSticky") && !el.closest(".pmx-footer") && !el.closest("[data-anim-root]");
    });
    if (!els.length) return;
    els.forEach(function (el) { el.classList.add("pmx-reveal"); });
    applyStagger(els);
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    if (!revealIO) revealIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); revealIO.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { revealIO.observe(el); });
    requestAnimationFrame(function () { els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 0.94 && r.bottom > 0) el.classList.add("is-visible"); }); });
  }
  function wireAnim() {
    revealScan(document);
    setTimeout(function () { document.querySelectorAll(".pmx-reveal:not(.is-visible)").forEach(function (el) { el.classList.add("is-visible"); }); }, 2600);
    wireCounters();
  }

  /* ---------------- FAB: ocultar la pestaña "Chat" al llegar al footer ---------------- */
  function wireFooterFab() {
    var footer = document.querySelector(".pmx-footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { document.body.classList.toggle("pmx-at-footer", en.isIntersecting); });
    }, { threshold: 0.02 });
    io.observe(footer);
  }

  /* ---------------- ESTADO ABIERTO / CERRADO (luz en vivo) ---------------- */
  function parseTime12(str) {
    var m = String(str).match(/(\d{1,2}):(\d{2})\s*(a|p)\.?m/i);
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12; if (/p/i.test(m[3])) h += 12;
    return h * 60 + parseInt(m[2], 10);
  }
  function isOpenNow() {
    var c = CFG.contact || {}, hrs = c.hours || [];
    if (!hrs.length) return null;
    var tz = c.tz || "America/New_York", wd = "", hh = 0, mm = 0;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
        .formatToParts(new Date()).forEach(function (p) {
          if (p.type === "weekday") wd = p.value.toLowerCase().slice(0, 3);
          else if (p.type === "hour") hh = parseInt(p.value, 10);
          else if (p.type === "minute") mm = parseInt(p.value, 10);
        });
    } catch (e) {
      var dt = new Date(), nm = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      wd = nm[dt.getDay()]; hh = dt.getHours(); mm = dt.getMinutes();
    }
    if (hh >= 24) hh -= 24;
    var entry = hrs.filter(function (h) { return h.day === wd; })[0];
    if (!entry || !entry.time || /cerrado|closed/i.test(entry.time)) return false;
    var seg = entry.time.split(/[–-]/); if (seg.length < 2) return false;
    var s = parseTime12(seg[0]), e = parseTime12(seg[1]);
    if (s == null || e == null) return false;
    var now = hh * 60 + mm; return now >= s && now < e;
  }
  function updateOpenStatus() {
    var el = document.getElementById("pmxOpenStatus"); if (!el) return;
    var open = isOpenNow();
    if (open === null) { el.innerHTML = ""; el.className = "pmx-openstatus"; return; }
    el.className = "pmx-openstatus " + (open ? "pmx-openstatus--open" : "pmx-openstatus--closed");
    el.innerHTML = '<span class="pmx-openstatus__dot"></span>' + (open ? t("open_now") : t("closed_now"));
  }

  /* ---------------- PRUEBA SOCIAL (FOMO) ---------------- */
  var PROOF_NAMES = ["Carlos R.", "María G.", "José L.", "Ana P.", "Luis M.", "Daniela V.", "Andrés C.", "Gabriela S.", "Miguel T.", "Valentina R.", "Jorge D.", "Camila F.", "Ricardo N.", "Sofía H.", "Pedro A.", "Isabella M.", "Roberto S.", "Patricia L."];
  var PROOF_ITEMS = ["Toyota RAV4 2026", "Toyota 4Runner TRD", "Toyota Crown Limited", "Toyota Sienna XLE", "Toyota Sequoia", "Van High Roof 3500", "Toyota Land Cruiser", "Ford Mustang", "Suzuki Swift", "Toyota Tacoma", "Honda CR-V"];
  function wireSocialProof() {
    var off = false; try { off = sessionStorage.getItem("pmx_proof_off") === "1"; } catch (e) {}
    if (off) return;
    var host = document.createElement("div");
    host.className = "pmx-proof"; host.id = "pmxProof";
    host.innerHTML = '<span class="pmx-proof__ic">🚗</span>' +
      '<div class="pmx-proof__body"><p class="pmx-proof__top"></p><p class="pmx-proof__item"></p><p class="pmx-proof__meta"></p></div>' +
      '<button class="pmx-proof__x" type="button" aria-label="Cerrar">&times;</button>';
    document.body.appendChild(host);
    var hideT = null, loopT = null;
    function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
    function showOne() {
      if (document.hidden) return;
      var n = 2 + Math.floor(Math.random() * 44);
      var ago = (LANG === "en") ? (n + " min ago") : ("hace " + n + " min");
      host.querySelector(".pmx-proof__top").innerHTML = '<b>' + rnd(PROOF_NAMES) + '</b> ' + t("proof_action");
      host.querySelector(".pmx-proof__item").textContent = rnd(PROOF_ITEMS);
      host.querySelector(".pmx-proof__meta").innerHTML = '<span class="pmx-proof__dot"></span> ' + ago + ' · ' + t("proof_verified");
      host.classList.add("is-on");
      if (hideT) clearTimeout(hideT);
      hideT = setTimeout(function () { host.classList.remove("is-on"); }, 6000);
    }
    host.querySelector(".pmx-proof__x").addEventListener("click", function () {
      host.classList.remove("is-on");
      if (loopT) clearInterval(loopT); if (hideT) clearTimeout(hideT);
      try { sessionStorage.setItem("pmx_proof_off", "1"); } catch (e) {}
    });
    setTimeout(function () { showOne(); loopT = setInterval(showOne, 21000); }, 9000);
  }

  /* ---------------- PROMO 15% OFF (botón flotante + popup, solo al hacer clic) ---------------- */
  function buildPromo() {
    // Ya NO hay botón flotante: el popup aparece SOLO a los 2 minutos de
    // navegación acumulada (una vez por sesión). En financiamiento nunca se
    // muestra: ahí el cliente ya está aplicando.
    if (/^\/financing\//.test(location.pathname)) return "";
    return '' +
      '<div class="pmx-promo" id="pmxPromo">' +
        '<div class="pmx-promo__box">' +
          '<button class="pmx-promo__x" id="pmxPromoX" type="button" aria-label="Cerrar">&times;</button>' +
          '<div class="pmx-promo__img"><img id="pmxPromoImg" alt="15% OFF"></div>' +
          '<div class="pmx-promo__body">' +
            '<span class="pmx-promo__badge" data-i18n="promo_badge">' + t("promo_badge") + '</span>' +
            '<h3 class="pmx-promo__title" data-i18n="promo_title">' + t("promo_title") + '</h3>' +
            '<p class="pmx-promo__sub" data-i18n="promo_sub">' + t("promo_sub") + '</p>' +
            '<div class="pmx-promo__timerlbl" data-i18n="promo_ends">' + t("promo_ends") + '</div>' +
            '<div class="pmx-promo__timer">' +
              '<div class="pmx-promo__seg"><b id="ppM">10</b><span data-i18n="promo_m">' + t("promo_m") + '</span></div>' +
              '<div class="pmx-promo__colon">:</div>' +
              '<div class="pmx-promo__seg"><b id="ppS">00</b><span data-i18n="promo_s">' + t("promo_s") + '</span></div>' +
              '<div class="pmx-promo__colon">:</div>' +
              '<div class="pmx-promo__seg pmx-promo__seg--accent"><b id="ppMs">000</b><span data-i18n="promo_ms">' + t("promo_ms") + '</span></div>' +
            '</div>' +
            '<div class="pmx-promo__cta">' +
              '<button class="pmx-promo__yes" id="pmxPromoYes" type="button" data-i18n="promo_yes">' + t("promo_yes") + '</button>' +
              '<button class="pmx-promo__no" id="pmxPromoNo" type="button" data-i18n="promo_no">' + t("promo_no") + '</button>' +
            '</div>' +
            '<p class="pmx-promo__fine" data-i18n="promo_fine">' + t("promo_fine") + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  function wirePromo() {
    var modal = document.getElementById("pmxPromo");
    if (!modal) return;
    var KEY = "pmx_promo_claim", DUR = 10 * 60 * 1000, tick = null, dl = 0;
    // El temporizador es solo VISUAL mientras el popup está abierto. El descuento se
    // RESERVA (se guarda en localStorage) únicamente al pulsar "Quiero mi descuento",
    // así el banner del formulario solo aparece si el cliente realmente lo reclamó.
    function pad(x, n) { x = String(x); while (x.length < n) x = "0" + x; return x; }
    function render() {
      var left = dl - Date.now(); if (left < 0) left = 0;
      var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000), ms = left % 1000;
      var M = document.getElementById("ppM"), S = document.getElementById("ppS"), MS = document.getElementById("ppMs");
      if (M) M.textContent = pad(m, 2); if (S) S.textContent = pad(s, 2); if (MS) MS.textContent = pad(ms, 3);
    }
    function open() { dl = Date.now() + DUR; modal.classList.add("is-open"); render(); if (tick) clearInterval(tick); tick = setInterval(render, 43); }
    function close() { modal.classList.remove("is-open"); if (tick) clearInterval(tick); }

    document.getElementById("pmxPromoX").addEventListener("click", close);
    document.getElementById("pmxPromoNo").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.getElementById("pmxPromoYes").addEventListener("click", function () {
      // Recién aquí se reserva: guardamos el deadline para sincronizar con el formulario.
      if (!dl || dl < Date.now()) dl = Date.now() + DUR;
      try { localStorage.setItem(KEY, String(dl)); } catch (e) {}
      location.href = "/financing/apply/?promo=15";
    });

    // APERTURA AUTOMÁTICA: a los 2 minutos de navegación acumulada en el
    // sitio (el contador sobrevive entre páginas), UNA sola vez por sesión.
    var SHOWN = "pmx_promo_shown", TKEY = "pmx_time_s";
    try { if (sessionStorage.getItem(SHOWN) === "1") return; } catch (e) { return; }
    var acc = 0; try { acc = +(sessionStorage.getItem(TKEY) || 0); } catch (e) {}
    var iv = setInterval(function () {
      if (document.hidden) return;             // no cuenta si la pestaña está oculta
      acc++;
      try { sessionStorage.setItem(TKEY, String(acc)); } catch (e) {}
      if (acc >= 120) {
        clearInterval(iv);
        // El flyer del popup vive en un CDN externo: la imagen se descarga y el
        // popup se abre SOLO si realmente carga (si el CDN falla, no se muestra
        // nada roto — y no gastamos la descarga al entrar a la página).
        var probe = new Image();
        probe.onload = function () {
          var pi = document.getElementById("pmxPromoImg"); if (pi) pi.src = probe.src;
          try { sessionStorage.setItem(SHOWN, "1"); } catch (e) {}
          open();
        };
        probe.src = t("promo_img");
      }
    }, 1000);
  }

  /* ---------------- FRANJA DE SORTEO (ticker GRANDE en movimiento) ---------------- */
  // Pedido del cliente: un texto grande que se desliza y OBLIGA a leer.
  // Toda la franja es un enlace a /referrals/, se pausa al pasar el mouse y
  // se pliega sola al hacer scroll (body.pmx-scrolled ya la colapsa).
  function buildRaffle() {
    var r = CFG.referrals || {};
    if (!r.raffleEnabled) return "";
    var off = false; try { off = sessionStorage.getItem("pmx_raffle_off") === "1"; } catch (e) {}
    if (off) return "";
    var group = '<span class="pmx-raffle__group">' +
      '<span data-i18n="raffle_big1">' + t("raffle_big1") + '</span><span class="pmx-raffle__sep">★</span>' +
      '<span data-i18n="raffle_big2">' + t("raffle_big2") + '</span><span class="pmx-raffle__sep">★</span>' +
      '<span data-i18n="raffle_big3">' + t("raffle_big3") + '</span><span class="pmx-raffle__sep">★</span>' +
    '</span>';
    return '<div class="pmx-raffle pmx-raffle--big" id="pmxRaffle">' +
      '<a class="pmx-raffle__link" href="/referrals/" aria-label="Sorteo Promax">' +
        '<div class="pmx-raffle__track">' + group + group + '</div>' +
      '</a>' +
      '<button class="pmx-raffle__x" id="pmxRaffleX" type="button" aria-label="Cerrar aviso">&times;</button>' +
    '</div>';
  }
  /* Fotos de tarjetas: si la MINIATURA (proxy de Cloudinary) fallara, se
     repinta al vuelo la foto ORIGINAL del dealer (data-orig). Y si esa también
     falla, se oculta la rota y queda el placeholder gris del contenedor. */
  document.addEventListener("error", function (e) {
    var el = e.target;
    if (!el || el.tagName !== "IMG" || !el.classList || !el.classList.contains("pmx-vcard__ph")) return;
    var orig = el.getAttribute("data-orig");
    if (orig && el.getAttribute("src") !== orig) { el.removeAttribute("data-orig"); el.setAttribute("src", orig); }
    else el.style.visibility = "hidden";
  }, true);

  function wireRaffle() {
    fillTickers();
    window.addEventListener("resize", fillTickers);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillTickers);
    var x = document.getElementById("pmxRaffleX");
    if (!x) return;
    x.addEventListener("click", function () {
      var bar = document.getElementById("pmxRaffle");
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
      try { sessionStorage.setItem("pmx_raffle_off", "1"); } catch (e) {}
      syncHeaderPad();
    });
  }

  /* ---------------- ALTO DEL HEADER: ESTABLE vs VIVO ----------------
     REGLA DE ORO (queja del cliente: "la página se mueve y salta sola"):
     la ESTRUCTURA de la página jamás se reacomoda por el header.
     · --header-h / --header-h-mobile = alto EXPANDIDO del header, medido con
       el plegado neutralizado. De aquí cuelgan el padding del body y el alto
       de los banners → se fija al cargar y NO cambia al hacer scroll.
     · --header-h-live = alto REAL en este instante (con la franja plegada).
       Solo lo usan los elementos sticky (barra de filtros, paneles): mover el
       top de un sticky NO reacomoda el documento, solo desliza esa barra. */
  function syncHeaderPad() {
    var s = document.getElementById("pmxSticky");
    if (!s) return;
    var b = document.body;
    var wasScrolled = b.classList.contains("pmx-scrolled");
    if (wasScrolled) {
      // Medición del alto EXPANDIDO sin que se vea ni se anime nada: se apagan
      // las transiciones, se despliega, se mide y se vuelve a plegar — todo
      // síncrono dentro del mismo frame (no hay pintado intermedio).
      b.classList.add("pmx-measuring");
      b.classList.remove("pmx-scrolled");
    }
    var h = s.offsetHeight;
    if (wasScrolled) {
      b.classList.add("pmx-scrolled");
      void s.offsetHeight; // aplica el plegado AHORA, aún sin transiciones
      b.classList.remove("pmx-measuring");
    }
    if (h > 0) {
      document.documentElement.style.setProperty("--header-h", h + "px");
      document.documentElement.style.setProperty("--header-h-mobile", h + "px");
    }
    syncHeaderLive();
  }
  function syncHeaderLive() {
    var s = document.getElementById("pmxSticky");
    if (!s) return;
    var h = s.offsetHeight;
    if (h > 0) document.documentElement.style.setProperty("--header-h-live", h + "px");
  }

  /* ---------------- HEADER QUE SE ENCOGE AL HACER SCROLL ---------------- */
  // Al bajar, la franja del sorteo y el marquee se pliegan (el header fijo no
  // se come la pantalla, clave en móvil). Al volver arriba, reaparecen.
  // ⚠️ Aquí SOLO se actualiza --header-h-live (sticky). El padding del body y
  // los banners usan el alto expandido y NO se tocan: cero saltos de página.
  function wireHeaderShrink() {
    var shrunk = false, t = null;
    function apply(s) {
      if (s === shrunk) return;
      shrunk = s;
      document.body.classList.toggle("pmx-scrolled", s);
      if (t) clearTimeout(t);
      t = setTimeout(syncHeaderLive, 320); // tras la transición de plegado
    }
    function onScroll() {
      var y = window.scrollY || 0;
      if (y > 130) apply(true);
      else if (y < 40) apply(false); // histéresis: sin parpadeo en el borde
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- TOAST ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("pmxToast");
    if (!el) { el = document.createElement("div"); el.id = "pmxToast"; el.className = "pmx-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("is-on");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2200);
  }

  /* ---------------- COMPARTIR (Web Share + hoja propia) ---------------- */
  var SHARE = { title: "", url: "" };
  function buildShareSheet() {
    if (document.getElementById("pmxShare")) return;
    var box = document.createElement("div");
    box.innerHTML = '' +
      '<div class="pmx-share" id="pmxShare">' +
        '<div class="pmx-share__box">' +
          '<h3 class="pmx-share__title" data-i18n="share_title">' + t("share_title") + '</h3>' +
          '<p class="pmx-share__sub" id="pmxShareSub"></p>' +
          '<div class="pmx-share__grid">' +
            '<a class="pmx-share__opt pmx-share__opt--wa" id="pmxShareWa" target="_blank" rel="noopener"><span class="pmx-share__opt-ic">' + IC.whatsapp + '</span><span data-i18n="share_wa">' + t("share_wa") + '</span></a>' +
            '<a class="pmx-share__opt pmx-share__opt--fb" id="pmxShareFb" target="_blank" rel="noopener"><span class="pmx-share__opt-ic">' + IC.facebook + '</span><span data-i18n="share_fb">' + t("share_fb") + '</span></a>' +
            '<button class="pmx-share__opt pmx-share__opt--copy" id="pmxShareCopy" type="button"><span class="pmx-share__opt-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span><span data-i18n="share_copy">' + t("share_copy") + '</span></button>' +
          '</div>' +
          '<button class="pmx-share__close" id="pmxShareClose" type="button" data-i18n="share_close">' + t("share_close") + '</button>' +
        '</div>' +
      '</div>';
    while (box.firstChild) document.body.appendChild(box.firstChild);
    var sh = document.getElementById("pmxShare");
    function close() { sh.classList.remove("is-open"); }
    sh.addEventListener("click", function (e) { if (e.target === sh) close(); });
    document.getElementById("pmxShareClose").addEventListener("click", close);
    document.getElementById("pmxShareWa").addEventListener("click", close);
    document.getElementById("pmxShareFb").addEventListener("click", close);
    document.getElementById("pmxShareCopy").addEventListener("click", function () {
      var done = function () { toast(t("share_copied")); close(); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SHARE.url).then(done).catch(function () { fallbackCopy(SHARE.url); done(); });
      } else { fallbackCopy(SHARE.url); done(); }
    });
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    } catch (e) {}
  }
  // Compartir un enlace: nativo (móvil: WhatsApp/grupos/redes) o hoja propia.
  function openShare(data) {
    SHARE.title = data.title || (CFG.brand ? CFG.brand.name : "");
    SHARE.url = data.url || location.href;
    if (navigator.share) {
      navigator.share({ title: SHARE.title, text: SHARE.title, url: SHARE.url }).catch(function () {});
      return;
    }
    buildShareSheet();
    var sub = document.getElementById("pmxShareSub");
    if (sub) sub.textContent = SHARE.title;
    var wa = document.getElementById("pmxShareWa");
    if (wa) wa.setAttribute("href", "https://wa.me/?text=" + encodeURIComponent(SHARE.title + "\n" + SHARE.url));
    var fb = document.getElementById("pmxShareFb");
    if (fb) fb.setAttribute("href", "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(SHARE.url));
    document.getElementById("pmxShare").classList.add("is-open");
  }

  /* ---------------- COMPRAR / MÁS INFO (WhatsApp + lead) ---------------- */
  function money(n) { return "$" + (Number(n) || 0).toLocaleString("en-US"); }
  function vehicleTitle(v) { return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" "); }
  function vehicleUrl(v) { return (CFG.siteUrl || location.origin) + "/vehicle/?id=" + encodeURIComponent(v.id); }

  /* ---------------- CAPTURA DE CONTACTO + WHATSAPP ----------------
     Antes de abrir WhatsApp pedimos Nombre + WhatsApp UNA sola vez (se
     recuerdan). Así el dueño SIEMPRE recibe el lead con datos de contacto
     (nombre + teléfono) — antes llegaban avisos "vacíos" desde los botones.
     Si ya tenemos los datos guardados, es 1 toque, sin fricción. */
  var LEAD_CB = null; // callback pendiente mientras el mini-formulario está abierto
  function leadStore() {
    try {
      var n = (localStorage.getItem("pmx_lead_name") || "").trim();
      var p = (localStorage.getItem("pmx_lead_phone") || "").trim();
      return (n && p.replace(/\D/g, "").length >= 7) ? { name: n, phone: p } : null;
    } catch (e) { return null; }
  }
  function leadSave(n, p) { try { localStorage.setItem("pmx_lead_name", n); localStorage.setItem("pmx_lead_phone", p); } catch (e) {} }

  function buildLeadModal() {
    var wa = '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden="true"><path d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1A7.9 7.9 0 0 0 12 19.9h.01a7.94 7.94 0 0 0 5.6-13.58ZM12 18.56a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25a6.59 6.59 0 1 1 5.59 3.09Zm3.62-4.93c-.2-.1-1.17-.58-1.35-.64s-.31-.1-.44.1-.51.64-.62.77-.23.15-.43.05a5.4 5.4 0 0 1-1.59-.98 6 6 0 0 1-1.1-1.37c-.12-.2 0-.31.09-.41s.2-.23.3-.35a1.36 1.36 0 0 0 .2-.33.37.37 0 0 0-.02-.35c-.05-.1-.44-1.07-.6-1.46s-.32-.33-.44-.34h-.38a.72.72 0 0 0-.52.24 2.19 2.19 0 0 0-.69 1.63 3.8 3.8 0 0 0 .8 2.02 8.7 8.7 0 0 0 3.33 2.94c.47.2.83.32 1.11.41a2.68 2.68 0 0 0 1.23.08c.37-.06 1.17-.48 1.33-.94s.17-.86.12-.94-.18-.14-.38-.24Z"/></svg>';
    return '' +
      '<div class="pmx-lead" id="pmxLead" aria-hidden="true">' +
        '<div class="pmx-lead__box" role="dialog" aria-modal="true" aria-labelledby="pmxLeadTitle">' +
          '<button type="button" class="pmx-lead__x" id="pmxLeadX" aria-label="Cerrar">&times;</button>' +
          '<div class="pmx-lead__brand">' + wa + '</div>' +
          '<h3 class="pmx-lead__title" id="pmxLeadTitle"></h3>' +
          '<p class="pmx-lead__sub" id="pmxLeadSub"></p>' +
          '<form class="pmx-lead__form" id="pmxLeadForm" novalidate>' +
            '<label class="pmx-lead__lbl" id="pmxLeadNameLbl" for="pmxLeadName"></label>' +
            '<input class="pmx-lead__in" id="pmxLeadName" type="text" autocomplete="name" required>' +
            '<label class="pmx-lead__lbl" id="pmxLeadPhoneLbl" for="pmxLeadPhone"></label>' +
            '<input class="pmx-lead__in" id="pmxLeadPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(000) 000-0000" required>' +
            '<button class="pmx-btn pmx-btn--primary pmx-btn--block pmx-lead__go" id="pmxLeadGo" type="submit"></button>' +
            '<p class="pmx-lead__note" id="pmxLeadNote"></p>' +
          '</form>' +
        '</div>' +
      '</div>';
  }
  function leadLabels() {
    return LANG === "en"
      ? { name: "Your name", phone: "Your WhatsApp", go: "Continue to WhatsApp →", note: "🔒 Only used to contact you. No spam.", title: "Almost there!", sub: "Leave your name and WhatsApp and we'll reply right away." }
      : { name: "Tu nombre", phone: "Tu WhatsApp", go: "Continuar a WhatsApp →", note: "🔒 Solo lo usamos para contactarte. Sin spam.", title: "¡Casi listo!", sub: "Déjanos tu nombre y WhatsApp y te respondemos enseguida." };
  }
  function shakeField(el) { if (!el) return; el.classList.remove("pmx-shake"); void el.offsetWidth; el.classList.add("pmx-shake"); try { el.focus(); } catch (e) {} }

  // Núcleo: registra el lead CON nombre + WhatsApp y abre WhatsApp al dueño.
  function captureThenWhatsApp(opts) {
    opts = opts || {};
    function done(name, phone) {
      try {
        submitLead({
          form_type: opts.form_type || "lead",
          name: name, phone: phone,
          vehicle_id: opts.vehicle_id || null,
          vehicle_title: opts.vehicle_title || null,
          message: opts.leadText || "",
        }).catch(function () {});
      } catch (e) {}
      try { window.open(waUrl(opts.waText), "_blank", "noopener"); } catch (e) {}
    }
    var known = leadStore();
    if (known) { done(known.name, known.phone); return; }   // ya nos dieron sus datos: 1 toque
    openLeadModal(opts, done);
  }

  function openLeadModal(opts, cb) {
    var m = document.getElementById("pmxLead");
    // Si el modal aún no montó, NO bloqueamos al cliente: abrimos WhatsApp igual.
    if (!m) { try { window.open(waUrl(opts.waText), "_blank", "noopener"); } catch (e) {} return; }
    var L = leadLabels();
    document.getElementById("pmxLeadTitle").textContent = opts.title || L.title;
    document.getElementById("pmxLeadSub").textContent = opts.sub || L.sub;
    document.getElementById("pmxLeadNameLbl").textContent = L.name;
    document.getElementById("pmxLeadPhoneLbl").textContent = L.phone;
    document.getElementById("pmxLeadGo").textContent = L.go;
    document.getElementById("pmxLeadNote").textContent = L.note;
    document.getElementById("pmxLeadX").setAttribute("aria-label", L.go);
    var pre = leadStore() || {};
    var nEl = document.getElementById("pmxLeadName"), pEl = document.getElementById("pmxLeadPhone");
    if (pre.name) nEl.value = pre.name;
    if (pre.phone) pEl.value = pre.phone;
    LEAD_CB = cb;
    m.classList.add("is-open"); m.setAttribute("aria-hidden", "false");
    document.body.classList.add("pmx-lead-open");
    setTimeout(function () { try { (nEl.value ? pEl : nEl).focus(); } catch (e) {} }, 60);
  }
  function closeLeadModal() {
    var m = document.getElementById("pmxLead");
    if (m) { m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true"); }
    document.body.classList.remove("pmx-lead-open");
    LEAD_CB = null;
  }
  function wireLead() {
    var m = document.getElementById("pmxLead"); if (!m) return;
    var x = document.getElementById("pmxLeadX"), form = document.getElementById("pmxLeadForm");
    if (x) x.addEventListener("click", closeLeadModal);
    m.addEventListener("click", function (e) { if (e.target === m) closeLeadModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && m.classList.contains("is-open")) closeLeadModal(); });
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nEl = document.getElementById("pmxLeadName"), pEl = document.getElementById("pmxLeadPhone");
      var n = (nEl.value || "").trim(), p = (pEl.value || "").trim();
      if (n.length < 2) { shakeField(nEl); return; }
      if (p.replace(/\D/g, "").length < 7) { shakeField(pEl); return; }
      leadSave(n, p);
      var cb = LEAD_CB; LEAD_CB = null;
      if (cb) cb(n, p);          // dentro del gesto del submit: window.open no se bloquea
      closeLeadModal();
    });
  }

  // COMPRAR: pide nombre + WhatsApp (una vez), guarda el lead CON contacto y abre WhatsApp.
  function buyVehicle(v) {
    if (!v) return;
    var title = vehicleTitle(v), price = money(v.price), url = vehicleUrl(v);
    var waText = (LANG === "en")
      ? "Hi Promax, I want to BUY this " + title + " (ID " + v.id + ", " + price + "). How do I proceed?\n" + url
      : "Hola Promax, quiero COMPRAR este " + title + " (ID " + v.id + ", " + price + "). ¿Cómo continúo?\n" + url;
    captureThenWhatsApp({
      form_type: "purchase", vehicle_id: v.id, vehicle_title: title,
      waText: waText,
      leadText: "🛒 INTENCIÓN DE COMPRA\n" + title + " · " + price + "\n" + url,
      title: (LANG === "en" ? "Great choice! 🛒" : "¡Excelente elección! 🛒"),
      sub: (LANG === "en" ? "Leave your name and WhatsApp — we'll help you with this " + title + " right away." : "Déjanos tu nombre y WhatsApp y te ayudamos con este " + title + " enseguida."),
    });
  }

  // MÁS INFORMACIÓN: mismo flujo, lead tipo "quote".
  function moreInfoVehicle(v) {
    if (!v) return;
    var title = vehicleTitle(v), price = money(v.price), url = vehicleUrl(v);
    var waText = (LANG === "en")
      ? "Hi Promax, I'd like MORE INFORMATION about this " + title + " (" + price + ").\n" + url
      : "Hola Promax, quiero MÁS INFORMACIÓN sobre este " + title + " (" + price + ").\n" + url;
    captureThenWhatsApp({
      form_type: "quote", vehicle_id: v.id, vehicle_title: title,
      waText: waText,
      leadText: "ℹ️ SOLICITUD DE INFORMACIÓN\n" + title + " · " + price + "\n" + url,
      title: (LANG === "en" ? "We'll send you the details ℹ️" : "Te damos toda la info ℹ️"),
      sub: (LANG === "en" ? "Leave your name and WhatsApp for this " + title + "." : "Déjanos tu nombre y WhatsApp para este " + title + "."),
    });
  }

  /* ---------------- TELÉFONO CON FORMATO AUTOMÁTICO ---------------- */
  // Mientras el cliente escribe su número en cualquier formulario (contacto,
  // financiamiento, etc.), se formatea solo a (305) 676-1259 — se ve profesional
  // y evita números incompletos. Los internacionales (+58…) se dejan tal cual.
  function formatUsPhone(v) {
    var raw = String(v || "");
    if (/^\s*\+/.test(raw)) return raw;                 // internacional: no tocar
    var d = raw.replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1); // 1 (código USA) inicial
    if (d.length > 10) return raw;                       // más largo que USA: no recortar
    if (d.length > 6) return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    if (d.length > 3) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    if (d.length) return "(" + d;
    return "";
  }
  function wirePhoneFormat() {
    // Delegación global: cubre los formularios actuales Y los que se inyecten después
    document.addEventListener("input", function (e) {
      var inp = e.target;
      if (!inp || inp.tagName !== "INPUT") return;
      if ((inp.getAttribute("type") || "").toLowerCase() !== "tel") return;
      var v = formatUsPhone(inp.value);
      if (v !== inp.value) inp.value = v;
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
    if (!document.getElementById("pmxPromo")) {
      var pr = document.createElement("div"); pr.innerHTML = buildPromo();
      while (pr.firstChild) document.body.appendChild(pr.firstChild);
    }
    if (!document.getElementById("pmxLead")) {
      var ld = document.createElement("div"); ld.innerHTML = buildLeadModal();
      document.body.appendChild(ld.firstChild);
    }

    var y = document.getElementById("pmxYear");
    if (y) y.textContent = new Date().getFullYear();

    wireLangButtons();
    wireNewsletter();
    wireDropdown();
    wireRaffle();
    wirePhoneFormat();
    applyI18n(LANG);
    wireAnim();
    wireFooterFab();
    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
    wirePromo();
    wireLead();

    // Alto real del header (franja de sorteo incluida): al montar, al cargar
    // fuentes/recursos y al cambiar el tamaño de la ventana.
    syncHeaderPad();
    window.addEventListener("resize", syncHeaderPad);
    window.addEventListener("load", syncHeaderPad);
    setTimeout(syncHeaderPad, 350);
    // Cuando terminan de cargar las FUENTES el texto del header cambia de
    // métrica: una última medición y de ahí en adelante el alto queda quieto.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderPad);
    wireHeaderShrink();
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
    money: money,
    num: function (n) { return (Number(n) || 0).toLocaleString("en-US"); },
    reveal: revealScan,
    // Catálogo multi-categoría + acciones de producto
    categories: catList,
    catLabel: catLabel,
    catIcon: catIcon,
    catSvg: catSvg,
    share: openShare,
    waUrl: waUrl,
    buy: buyVehicle,
    moreInfo: moreInfoVehicle,
    captureThenWhatsApp: captureThenWhatsApp,
    toast: toast,
    syncHeader: syncHeaderPad,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  // Medición de tráfico (analytics propio + GA4/Clarity si hay IDs en config).
  // Se carga aparte para no frenar el render; corre en TODAS las páginas que
  // usan site.js. Ver assets/js/analytics.js y /admin/analytics.html.
  try {
    var anScript = document.createElement("script");
    anScript.src = "/assets/js/analytics.js";
    anScript.async = true;
    document.body.appendChild(anScript);
  } catch (e) {}
})();
