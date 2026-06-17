/* =========================================================================
   PROMAX AUTO BROKER — MANEJADOR DE FORMULARIOS DE LEADS
   Cualquier <form data-pm-form="financing|financing_quick|contact|newsletter">
   se envía a Google Apps Script (PROMAX_CONFIG.appsScriptUrl).
   Si la URL está vacía: "modo demo" (muestra éxito sin enviar).
   ========================================================================= */
(function(){
  var C = window.PROMAX_CONFIG || {};
  var I = window.PROMAX_I18N;
  function lang(){ return I ? I.get() : 'es'; }
  var T = {
    es:{ sending:"Enviando...", ok:"¡Recibido! Te contactaremos muy pronto.", err:"Algo salió mal. Intenta de nuevo o escríbenos por WhatsApp.", demo:"(Modo demo) Formulario válido. Conecta Google Sheets para guardar los datos." },
    en:{ sending:"Sending...", ok:"Received! We'll contact you very soon.", err:"Something went wrong. Try again or message us on WhatsApp.", demo:"(Demo mode) Valid form. Connect Google Sheets to store the data." }
  };
  function t(k){ return (T[lang()]&&T[lang()][k])||T.es[k]; }

  function post(payload){
    if(!C.appsScriptUrl){
      return new Promise(function(res){ console.log('[ProMax demo] payload:', payload); setTimeout(res,500); });
    }
    // "simple request" (text/plain) => sin preflight CORS
    return fetch(C.appsScriptUrl, { method:'POST', body: JSON.stringify(payload) })
      .then(function(r){ return r.json().catch(function(){return {};}); });
  }

  function collect(form){
    var d={}; new FormData(form).forEach(function(v,k){ d[k]=v; });
    return d;
  }

  function showAlert(form, type){
    var box = form.querySelector('.pm-alert');
    if(!box) return;
    box.className = 'pm-alert show ' + (type==='ok'?'pm-alert--ok':'pm-alert--err');
    box.textContent = type==='ok' ? (C.appsScriptUrl?t('ok'):t('demo')) : t('err');
    box.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function handle(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      var type = form.getAttribute('data-pm-form');
      var btn = form.querySelector('[type=submit]');
      var btnHTML = btn ? btn.innerHTML : '';
      if(btn){ btn.disabled=true; btn.style.opacity='.7'; btn.innerHTML = t('sending'); }

      var d = collect(form);
      var fullName = (d.first_name||d.name||'') + (d.last_name?(' '+d.last_name):'');
      fullName = fullName.trim();

      // financing_quick: guarda para prellenar la app completa
      if(type==='financing_quick'){
        try{ sessionStorage.setItem('pm_prefill', JSON.stringify({first_name:d.first_name||'',last_name:d.last_name||'',email:d.email||'',phone:d.phone||''})); }catch(e){}
      }

      var payload = {
        form_type: type,
        name: fullName,
        email: d.email||'',
        phone: d.phone||'',
        message: d.message||'',
        raw_fields: d,
        _source_url: location.href,
        _submitted_at: new Date().toISOString(),
        _lang: lang()
      };

      post(payload).then(function(){
        if(type==='financing_quick'){ location.href='/financiamiento/aplicar/'; return; }
        // success: si hay bloque dedicado, mostrarlo
        var success = form.querySelector('.pm-form__success') || document.getElementById('pmApplySuccess');
        if(success){
          form.querySelectorAll('.pm-form__section, .pm-form__submit').forEach(function(el){el.style.display='none';});
          success.style.display='block';
          success.scrollIntoView({behavior:'smooth',block:'center'});
        } else {
          showAlert(form,'ok');
          form.reset();
          if(btn){ btn.disabled=false; btn.style.opacity='1'; btn.innerHTML=btnHTML; }
        }
      }).catch(function(err){
        console.error(err);
        showAlert(form,'err');
        if(btn){ btn.disabled=false; btn.style.opacity='1'; btn.innerHTML=btnHTML; }
      });
    });
  }

  function prefill(){
    // prellena la app completa de financiamiento con datos del mini-form
    try{
      var p=JSON.parse(sessionStorage.getItem('pm_prefill')||'{}');
      ['first_name','last_name','email','phone'].forEach(function(k){
        var el=document.querySelector('[name="'+k+'"]'); if(el&&p[k])el.value=p[k];
      });
      sessionStorage.removeItem('pm_prefill');
    }catch(e){}
    // prellena vehículo desde ?v=
    var v=new URLSearchParams(location.search).get('v');
    if(v){ var el=document.querySelector('[name="vehiculo"]'); if(el) el.value=v; }
  }

  function start(){
    document.querySelectorAll('form[data-pm-form]').forEach(handle);
    prefill();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
