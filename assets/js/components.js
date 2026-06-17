/* =========================================================================
   PROMAX AUTO BROKER — COMPONENTES COMPARTIDOS
   Inyecta header (top bar + nav + marquee), footer y widget de WhatsApp.
   Las páginas incluyen:  <div id="site-header"></div> ... <div id="site-footer"></div>
   El <body> lleva data-page="home|inventory|import|financing|about|contact|faqs"
   para resaltar el enlace activo.
   ========================================================================= */
(function(){
  var C = window.PROMAX_CONFIG || {};
  var I = window.PROMAX_I18N;
  var page = document.body.getAttribute('data-page') || '';

  var FLAG_ES = "https://flagcdn.com/w40/es.png";
  var FLAG_US = "https://flagcdn.com/w40/us.png";

  function waUrl(){
    var lang = I ? I.get() : 'es';
    var msg = lang === 'en' ? (C.waMessageEn||'') : (C.waMessageEs||'');
    return "https://wa.me/" + (C.whatsappNumber||'') + "?text=" + encodeURIComponent(msg);
  }

  function navLink(href, key, fallback, id){
    var active = (id === page) ? ' active' : '';
    return '<a href="'+href+'" class="pm-nav__link'+active+'"><span data-i18n="'+key+'">'+fallback+'</span></a>';
  }

  function marqueeGroup(){
    var items = [
      ['m_usa_vzla','Compramos en USA, enviamos a Venezuela'],
      ['m_approval','Aprobación rápida'],
      ['m_credit','Crédito fácil · Crédito malo OK'],
      ['m_inspection','Inspección incluida'],
      ['m_toyota','Toyota nuevos y usados'],
      ['m_trucks','Chutos y camiones']
    ];
    var html = '<div class="pm-marquee__group">';
    items.forEach(function(it){
      html += '<span class="pm-marquee__item">★ <span data-i18n="'+it[0]+'">'+it[1]+'</span></span><span class="pm-marquee__sep">●</span>';
    });
    return html + '</div>';
  }

  function buildHeader(){
    var langBtns =
      '<div class="pm-lang">'+
        '<button class="pm-lang__btn" type="button" data-lang="es"><img src="'+FLAG_ES+'" alt="ES"><span>ES</span></button>'+
        '<button class="pm-lang__btn" type="button" data-lang="en"><img src="'+FLAG_US+'" alt="EN"><span>EN</span></button>'+
      '</div>';

    var logo =
      '<a href="/" class="pm-logo" aria-label="ProMax Auto Broker">'+
        '<span class="pm-logo__text"><b>PRO<span>MAX</span></b><small>Auto Broker</small></span>'+
      '</a>';

    var links =
      navLink('/', 'nav_home', 'Inicio', 'home') +
      navLink('/inventario/', 'nav_inventory', 'Inventario', 'inventory') +
      navLink('/importacion/', 'nav_import', 'Importación', 'import') +
      navLink('/financiamiento/', 'nav_financing', 'Financiamiento', 'financing') +
      navLink('/nosotros/', 'nav_about', 'Nosotros', 'about') +
      navLink('/contacto/', 'nav_contact', 'Contacto', 'contact') +
      navLink('/faqs/', 'nav_faqs', 'Preguntas', 'faqs');

    var topbar =
      '<div class="pm-topbar"><div class="pm-topbar__inner">'+
        '<div class="pm-topbar__left">'+
          '<span><span class="material-icons-outlined">schedule</span> <span data-i18n="header_hours">Lun–Sáb 9AM–7PM</span></span>'+
          '<span><span class="material-icons-outlined">place</span> <span data-i18n="header_address">Miami, FL · Servicio a toda Venezuela</span></span>'+
        '</div>'+
        '<div class="pm-topbar__right">'+ langBtns +
          '<a href="/financiamiento/aplicar/" class="pm-topbar__cta"><span data-i18n="cta_prequalify">Pre-Calificar</span></a>'+
        '</div>'+
      '</div></div>';

    var nav = '<div class="pm-nav"><div class="pm-nav__inner">'+ logo + links + langBtns +
      '<button class="pm-burger" type="button" aria-label="Menú" onclick="document.body.classList.toggle(\'pm-open\')"><span class="material-icons-outlined">menu</span></button>'+
      '</div></div>';

    var mobile =
      '<div class="pm-mobile-menu">'+
        '<a href="/"><span data-i18n="nav_home">Inicio</span></a>'+
        '<a href="/inventario/"><span data-i18n="nav_inventory">Inventario</span></a>'+
        '<a href="/importacion/"><span data-i18n="nav_import">Importación</span></a>'+
        '<a href="/financiamiento/"><span data-i18n="nav_financing">Financiamiento</span></a>'+
        '<a href="/financiamiento/aplicar/" class="cta"><span data-i18n="nav_financing_apply">Aplicar a Financiamiento</span></a>'+
        '<a href="/nosotros/"><span data-i18n="nav_about">Nosotros</span></a>'+
        '<a href="/contacto/"><span data-i18n="nav_contact">Contacto</span></a>'+
        '<a href="/faqs/"><span data-i18n="nav_faqs">Preguntas</span></a>'+
      '</div>';

    var marquee = '<div class="pm-marquee"><div class="pm-marquee__track">'+ marqueeGroup() + marqueeGroup() +'</div></div>';

    return '<div id="pmSticky">'+ topbar + nav + mobile + marquee +'</div>';
  }

  function buildFooter(){
    return ''+
    '<footer class="pm-footer"><div class="pm-footer__top"><div class="pm-footer__inner">'+
      '<div class="pm-footer__col">'+
        '<div class="pm-footer__logo"><b>PRO<span>MAX</span></b><small>Auto Broker</small></div>'+
        '<p class="pm-footer__tagline" data-i18n="footer_tagline">Tu aliado en cada compra SIN RIESGOS. Compramos, inspeccionamos e importamos vehículos desde USA hacia Venezuela.</p>'+
        '<div class="pm-footer__social">'+
          '<a href="'+(C.instagram||'#')+'" target="_blank" rel="noopener" aria-label="Instagram"><span class="material-icons-outlined">photo_camera</span></a>'+
          '<a href="'+(C.facebook||'#')+'" target="_blank" rel="noopener" aria-label="Facebook"><span class="material-icons-outlined">thumb_up</span></a>'+
          '<a href="'+waUrl()+'" target="_blank" rel="noopener" aria-label="WhatsApp"><span class="material-icons-outlined">chat</span></a>'+
        '</div>'+
      '</div>'+
      '<div class="pm-footer__col"><h4 data-i18n="footer_explore">Explora</h4><ul>'+
        '<li><a href="/inventario/"><span data-i18n="nav_inventory">Inventario</span></a></li>'+
        '<li><a href="/importacion/"><span data-i18n="nav_import">Importación</span></a></li>'+
        '<li><a href="/financiamiento/"><span data-i18n="nav_financing">Financiamiento</span></a></li>'+
        '<li><a href="/nosotros/"><span data-i18n="nav_about">Nosotros</span></a></li>'+
      '</ul></div>'+
      '<div class="pm-footer__col"><h4 data-i18n="footer_resources">Recursos</h4><ul>'+
        '<li><a href="/financiamiento/aplicar/"><span data-i18n="nav_financing_apply">Aplicar a Financiamiento</span></a></li>'+
        '<li><a href="/contacto/"><span data-i18n="nav_contact">Contacto</span></a></li>'+
        '<li><a href="/faqs/"><span data-i18n="nav_faqs">Preguntas</span></a></li>'+
        '<li><a href="/referidos/">Referidos</a></li>'+
      '</ul></div>'+
      '<div class="pm-footer__col"><h4 data-i18n="footer_contact_title">Contacto</h4><ul class="pm-footer__contact">'+
        '<li><span class="material-icons-outlined">person</span> '+(C.agentName||'')+'</li>'+
        '<li><span class="material-icons-outlined">call</span> <a href="tel:+'+(C.phoneRaw||'')+'">'+(C.phoneDisplay||'')+'</a></li>'+
        '<li><span class="material-icons-outlined">place</span> <span data-i18n="header_address">Miami, FL · Servicio a toda Venezuela</span></li>'+
        '<li><span class="material-icons-outlined">schedule</span> <span data-i18n="header_hours">Lun–Sáb 9AM–7PM</span></li>'+
      '</ul></div>'+
    '</div></div>'+
    '<div class="pm-footer__bottom"><div class="pm-footer__bottom-inner">'+
      '<p>© <span id="pmYear">2026</span> <span data-i18n="footer_rights">ProMax Auto Broker. Todos los derechos reservados.</span></p>'+
      '<div class="pm-footer__legal">'+
        '<a href="/privacidad/"><span data-i18n="footer_privacy">Política de Privacidad</span></a>'+
        '<a href="/terminos/"><span data-i18n="footer_terms">Términos de Uso</span></a>'+
      '</div>'+
    '</div></div></footer>';
  }

  function buildChat(){
    var wa = waUrl();
    return '<div class="pm-cw">'+
      '<a href="'+wa+'" class="pm-cw__chat" target="_blank" rel="noopener" id="pmChatLink"><span class="material-icons-outlined">chat</span><span data-i18n="chat_text">Chat con Nosotros</span></a>'+
      '<a href="'+wa+'" class="pm-cw__wa" target="_blank" rel="noopener" id="pmWaLink" aria-label="WhatsApp">'+
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="M16 4C9.4 4 4 9.4 4 16c0 2.1.5 4.1 1.5 5.9L4 28l6.3-1.5c1.7.9 3.7 1.5 5.7 1.5 6.6 0 12-5.4 12-12S22.6 4 16 4zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7.9.9-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.4-9.9 9.9-9.9s9.9 4.4 9.9 9.9c0 5.5-4.4 9.9-9.9 9.9zm5.4-7.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.4z"/></svg>'+
      '</a></div>';
  }

  function mount(){
    var h = document.getElementById('site-header');
    if(h) h.innerHTML = buildHeader();
    var f = document.getElementById('site-footer');
    if(f) f.innerHTML = buildFooter();
    document.body.insertAdjacentHTML('beforeend', buildChat());

    var y = document.getElementById('pmYear'); if(y) y.textContent = new Date().getFullYear();

    // refresca traducciones del HTML recién inyectado
    if(I){ I.bindButtons(); I.apply(); }

    // actualiza enlaces de WhatsApp al cambiar idioma
    window.addEventListener('promax-lang-change', function(){
      var wa = waUrl();
      var c = document.getElementById('pmChatLink'); if(c) c.href = wa;
      var w = document.getElementById('pmWaLink'); if(w) w.href = wa;
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
