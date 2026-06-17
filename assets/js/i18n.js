/* =========================================================================
   PROMAX AUTO BROKER — MOTOR DE TRADUCCIÓN (ES / EN)
   - El HTML lleva data-i18n="clave" con el texto en ESPAÑOL como respaldo.
   - data-i18n-ph="clave" traduce placeholders.
   - Las páginas registran sus textos con PROMAX_I18N.add({es:{...},en:{...}}).
   - Llama PROMAX_I18N.apply(lang) después de inyectar HTML dinámico.
   ========================================================================= */
window.PROMAX_I18N = (function(){
  var cfg = window.PROMAX_CONFIG || {};
  var dict = { es:{}, en:{} };
  var lang = (function(){
    try{ var x = localStorage.getItem('promax_lang'); if(x==='es'||x==='en') return x; }catch(e){}
    return cfg.defaultLang || 'es';
  })();

  function add(obj){
    if(!obj) return;
    if(obj.es) for(var k in obj.es) dict.es[k] = obj.es[k];
    if(obj.en) for(var k in obj.en) dict.en[k] = obj.en[k];
  }
  function t(key){
    return (dict[lang] && dict[lang][key]) || dict.es[key] || key;
  }
  var DEFAULT = (cfg.defaultLang || 'es');
  function apply(l){
    if(l) lang = l;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n');
      if(el.__pmOrig == null) el.__pmOrig = el.innerHTML;   // captura el original (ES) una vez
      var v = (dict[lang] && dict[lang][k]);
      // En el idioma por defecto (ES) siempre restauramos el HTML original si no hay override
      if(v == null && lang === DEFAULT) v = el.__pmOrig;
      el.innerHTML = (v != null) ? v : el.__pmOrig;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      var k = el.getAttribute('data-i18n-ph');
      if(el.__pmOrigPh == null) el.__pmOrigPh = el.getAttribute('placeholder') || '';
      var v = (dict[lang] && dict[lang][k]);
      if(v == null && lang === DEFAULT) v = el.__pmOrigPh;
      el.setAttribute('placeholder', (v != null) ? v : el.__pmOrigPh);
    });
    document.querySelectorAll('.pm-lang__btn').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    document.documentElement.setAttribute('lang', lang);
    try{ localStorage.setItem('promax_lang', lang); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('promax-lang-change',{detail:{lang:lang}})); }catch(e){}
  }
  function bindButtons(){
    document.querySelectorAll('.pm-lang__btn').forEach(function(b){
      if(b.__pmBound) return; b.__pmBound = true;
      b.addEventListener('click', function(ev){ ev.preventDefault(); apply(b.getAttribute('data-lang')); });
    });
  }
  function get(){ return lang; }

  /* --- Diccionario compartido (header, footer, marquee, chat, comunes) --- */
  add({
    es:{
      // top bar / nav
      header_hours:"Lun–Sáb 9AM–7PM",
      header_address:"Miami, FL · Servicio a toda Venezuela",
      cta_prequalify:"Pre-Calificar",
      nav_home:"Inicio", nav_inventory:"Inventario", nav_financing:"Financiamiento",
      nav_import:"Importación", nav_about:"Nosotros", nav_contact:"Contacto", nav_faqs:"Preguntas",
      nav_financing_apply:"Aplicar a Financiamiento", nav_financing_overview:"Resumen de Financiamiento",
      // marquee
      m_usa_vzla:"Compramos en USA, enviamos a Venezuela",
      m_approval:"Aprobación rápida",
      m_credit:"Crédito fácil · Crédito malo OK",
      m_inspection:"Inspección incluida",
      m_toyota:"Toyota nuevos y usados",
      m_trucks:"Chutos y camiones",
      m_sinriesgos:"Compra SIN RIESGOS",
      // chat
      chat_text:"Chat con Nosotros",
      // footer
      footer_tagline:"Tu aliado en cada compra SIN RIESGOS. Compramos, inspeccionamos e importamos vehículos desde USA hacia Venezuela.",
      footer_explore:"Explora", footer_resources:"Recursos", footer_contact_title:"Contacto",
      footer_rights:"ProMax Auto Broker. Todos los derechos reservados.",
      footer_privacy:"Política de Privacidad", footer_terms:"Términos de Uso",
      // botones comunes
      btn_view_inventory:"Ver Inventario", btn_view_all:"Ver Todo el Inventario",
      btn_whatsapp:"Escríbenos por WhatsApp", btn_details:"Ver Detalles",
      btn_prequalify:"Pre-Calificar", btn_apply:"Aplicar Ahora", btn_contact:"Contáctanos"
    },
    en:{
      header_hours:"Mon–Sat 9AM–7PM",
      header_address:"Miami, FL · Service to all Venezuela",
      cta_prequalify:"Get Pre-Qualified",
      nav_home:"Home", nav_inventory:"Inventory", nav_financing:"Financing",
      nav_import:"Import", nav_about:"About", nav_contact:"Contact", nav_faqs:"FAQs",
      nav_financing_apply:"Apply for Financing", nav_financing_overview:"Financing Overview",
      m_usa_vzla:"We buy in the USA, ship to Venezuela",
      m_approval:"Fast Approval",
      m_credit:"Easy Credit · Bad Credit OK",
      m_inspection:"Inspection Included",
      m_toyota:"New & Used Toyotas",
      m_trucks:"Trucks & Semis",
      m_sinriesgos:"Purchase WITHOUT RISKS",
      chat_text:"Chat with Us",
      footer_tagline:"Your ally in every purchase WITHOUT RISKS. We buy, inspect and import vehicles from the USA to Venezuela.",
      footer_explore:"Explore", footer_resources:"Resources", footer_contact_title:"Contact",
      footer_rights:"ProMax Auto Broker. All rights reserved.",
      footer_privacy:"Privacy Policy", footer_terms:"Terms of Use",
      btn_view_inventory:"View Inventory", btn_view_all:"View All Inventory",
      btn_whatsapp:"Message us on WhatsApp", btn_details:"View Details",
      btn_prequalify:"Get Pre-Qualified", btn_apply:"Apply Now", btn_contact:"Contact Us"
    }
  });

  function init(){
    bindButtons();
    apply(lang);
    // re-vincula por si se inyecta HTML después
    setInterval(bindButtons, 2000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { add:add, apply:apply, t:t, get:get, bindButtons:bindButtons };
})();
