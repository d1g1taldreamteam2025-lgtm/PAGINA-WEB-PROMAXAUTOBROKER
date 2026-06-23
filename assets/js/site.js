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
    var mtrack = document.querySelector(".pmx-marquee__track");
    if (mtrack) mtrack.innerHTML = marqueeTrackHTML(LANG);
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
      open_now: "Abierto ahora", closed_now: "Cerrado",
      proof_action: "acaba de reservar", proof_verified: "Reserva verificada",
      promo_badge: "Solo para ti", promo_title: "Reclama tu 15% OFF",
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
      open_now: "Open now", closed_now: "Closed",
      proof_action: "just reserved", proof_verified: "Verified reservation",
      promo_badge: "Just for you", promo_title: "Claim your 15% OFF",
      promo_sub: "Apply for financing today and get <b>15% off</b> your first purchase.",
      promo_ends: "Your discount expires in", promo_h: "Hours", promo_m: "Min", promo_s: "Sec", promo_ms: "Ms",
      promo_yes: "I want my discount", promo_no: "No, thanks",
      promo_fine: "New clients only. Not combinable with other promotions.",
    },
  });

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
    { href: "/financing/", key: "nav_financing", dropdown: true },
    { href: "/about/", key: "nav_about" },
    { href: "/contact/", key: "nav_contact" },
    { href: "/faqs/", key: "nav_faqs" },
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
      return '<a href="' + n.href + '"><span data-i18n="' + n.key + '">' + t(n.key) + "</span></a>";
    }).join("") +
      '<a href="/financing/apply/" class="pmx-mobilemenu__cta"><span data-i18n="cta_prequalify">' + t("cta_prequalify") + "</span></a>";

    var marqueeGroup = marqueeTrackHTML(LANG);

    return '' +
      '<div id="pmxSticky">' +
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
  // Guarda el lead en Supabase (para el panel de leads). No bloquea ni rompe el
  // flujo si la tabla no existe o la base no responde.
  function insertInquiry(payload) {
    var db = CFG.db || {};
    if (!db.url || !db.anonKey || !db.inquiriesTable) return;
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
    fetch(db.url + "/rest/v1/" + db.inquiriesTable, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": db.anonKey,
        "Authorization": "Bearer " + db.anonKey,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(row),
      keepalive: true,
    }).catch(function () {});
  }

  function submitLead(payload) {
    payload._source_url = location.href;
    payload._submitted_at = new Date().toISOString();
    payload._lang = LANG;
    insertInquiry(payload);
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

  /* ---------------- MENÚ DESPLEGABLE (Financiamiento) ---------------- */
  var ddDocWired = false;
  function wireDropdown() {
    document.querySelectorAll("[data-dd]").forEach(function (wrap) {
      var trigger = wrap.querySelector("[data-dd-trigger]");
      if (!trigger || trigger.__dd) return; trigger.__dd = true;
      trigger.addEventListener("click", function (e) {
        if (window.matchMedia("(max-width:1024px)").matches) return; // en móvil usa el menú hamburguesa
        e.preventDefault();
        var isOpen = wrap.classList.contains("open");
        document.querySelectorAll("[data-dd].open").forEach(function (w) { w.classList.remove("open"); });
        if (!isOpen) wrap.classList.add("open");
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
      var dur = 1600, start = null;
      function fmt(v) { return pre + (dec ? v.toFixed(1) : Math.floor(v).toLocaleString("en-US")) + suf; }
      function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(target * e); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target); }
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
    return '' +
      '<button class="pmx-promo-fab" id="pmxPromoFab" type="button" aria-label="15% OFF">' +
        '<span class="pmx-promo-fab__big">15%</span><span class="pmx-promo-fab__small">OFF</span>' +
      '</button>' +
      '<div class="pmx-promo" id="pmxPromo">' +
        '<div class="pmx-promo__box">' +
          '<button class="pmx-promo__x" id="pmxPromoX" type="button" aria-label="Cerrar">&times;</button>' +
          '<div class="pmx-promo__img"><img src="https://res.cloudinary.com/drbc4wbvw/image/upload/v1782165811/post_1_6_wxp5cw.png" alt="15% OFF"></div>' +
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
    var modal = document.getElementById("pmxPromo"), fab = document.getElementById("pmxPromoFab");
    if (!modal || !fab) return;
    var KEY = "pmx_promo_claim", DUR = 10 * 60 * 1000, tick = null, dl = 0;
    // El temporizador de 10 min arranca al ABRIR el popup y se guarda, así el
    // formulario de financiamiento continúa la MISMA cuenta (sincronizada).
    function ensureDeadline() {
      dl = +(localStorage.getItem(KEY) || 0);
      if (!dl || dl < Date.now()) { dl = Date.now() + DUR; try { localStorage.setItem(KEY, String(dl)); } catch (e) {} }
      return dl;
    }
    function pad(x, n) { x = String(x); while (x.length < n) x = "0" + x; return x; }
    function render() {
      var left = dl - Date.now(); if (left < 0) left = 0;
      var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000), ms = left % 1000;
      var M = document.getElementById("ppM"), S = document.getElementById("ppS"), MS = document.getElementById("ppMs");
      if (M) M.textContent = pad(m, 2); if (S) S.textContent = pad(s, 2); if (MS) MS.textContent = pad(ms, 3);
    }
    function open() { ensureDeadline(); modal.classList.add("is-open"); render(); if (tick) clearInterval(tick); tick = setInterval(render, 43); }
    function close() { modal.classList.remove("is-open"); if (tick) clearInterval(tick); }
    fab.addEventListener("click", open);
    document.getElementById("pmxPromoX").addEventListener("click", close);
    document.getElementById("pmxPromoNo").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.getElementById("pmxPromoYes").addEventListener("click", function () {
      ensureDeadline();
      location.href = "/financing/apply/?promo=15";
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

    var y = document.getElementById("pmxYear");
    if (y) y.textContent = new Date().getFullYear();

    wireLangButtons();
    wireNewsletter();
    wireDropdown();
    applyI18n(LANG);
    wireAnim();
    wireFooterFab();
    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
    wireSocialProof();
    wirePromo();
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
    reveal: revealScan,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
