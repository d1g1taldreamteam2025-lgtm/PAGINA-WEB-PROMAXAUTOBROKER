/* =========================================================================
   PROMAX AUTO BROKER — PANEL INTERNO DE REFERIDOS
   - Acceso por clave simple (PROMAX_CONFIG.referralPasscode).
   - Registra referidos en Google Sheets (form_type:'referral').
   - Muestra progreso X / meta (ventas marcadas "vendido") para el sorteo.
   NOTA: la clave es una barrera básica del lado del cliente, no seguridad fuerte.
   ========================================================================= */
(function(){
  var C = window.PROMAX_CONFIG || {};
  var I = window.PROMAX_I18N;
  function lang(){ return I ? I.get() : 'es'; }
  var T = {
    es:{ wrong:"Clave incorrecta", sending:"Enviando...", ok:"¡Referido registrado!", err:"No se pudo guardar. Revisa la conexión.",
         of:"de", remaining:"ventas para el sorteo", reached:"🎉 ¡Meta alcanzada! Es hora del sorteo.", loading:"Cargando..." },
    en:{ wrong:"Wrong passcode", sending:"Sending...", ok:"Referral saved!", err:"Could not save. Check the connection.",
         of:"of", remaining:"sales to the raffle", reached:"🎉 Goal reached! Time for the raffle.", loading:"Loading..." }
  };
  function t(k){ return (T[lang()]&&T[lang()][k])||T.es[k]; }

  /* ---- Gate ---- */
  function initGate(){
    var gate=document.getElementById('pmGate'), panel=document.getElementById('pmRefPanel');
    if(!gate||!panel) return;
    function unlock(){ gate.style.display='none'; panel.style.display='block'; loadStatus(); }
    try{ if(sessionStorage.getItem('pm_ref_ok')==='1'){ unlock(); return; } }catch(e){}
    var inp=document.getElementById('pmGateInput'), btn=document.getElementById('pmGateBtn'), err=document.getElementById('pmGateErr');
    function check(){
      if((inp.value||'').trim()===String(C.referralPasscode)){
        try{ sessionStorage.setItem('pm_ref_ok','1'); }catch(e){}
        err.textContent=''; unlock();
      } else { err.textContent=t('wrong'); inp.select(); }
    }
    btn.addEventListener('click',check);
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter') check(); });
  }

  /* ---- Estado / progreso ---- */
  function setProgress(sales){
    var goal=C.referralGoal||100;
    var pct=Math.min(100, Math.round((sales/goal)*100));
    var cnt=document.getElementById('pmRefCount'); if(cnt) cnt.innerHTML=sales+' <span>/ '+goal+'</span>';
    var fill=document.getElementById('pmRefFill'); if(fill) fill.style.width=pct+'%';
    var hint=document.getElementById('pmRefHint'); if(hint) hint.textContent=Math.max(0,goal-sales)+' '+t('remaining');
    var win=document.getElementById('pmRefWin'); if(win) win.classList.toggle('show', sales>=goal);
  }
  function loadStatus(){
    var cnt=document.getElementById('pmRefCount'); if(cnt) cnt.textContent=t('loading');
    if(!C.appsScriptUrl){ setProgress(0); return; }
    fetch(C.appsScriptUrl+'?action=status',{cache:'no-store'})
      .then(function(r){return r.json();})
      .then(function(d){ setProgress((d&&typeof d.sales==='number')?d.sales:0); })
      .catch(function(){ setProgress(0); });
  }

  /* ---- Form ---- */
  function initForm(){
    var form=document.getElementById('pmRefForm'); if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      var btn=form.querySelector('[type=submit]'), html=btn?btn.innerHTML:'';
      if(btn){ btn.disabled=true; btn.style.opacity='.7'; btn.innerHTML=t('sending'); }
      var d={}; new FormData(form).forEach(function(v,k){d[k]=v;});
      var payload={
        form_type:'referral',
        name:d.ref_name||'',
        phone:d.ref_phone||'',
        raw_fields:d,
        _source_url:location.href,
        _submitted_at:new Date().toISOString(),
        _lang:lang()
      };
      var done=function(ok){
        var box=form.querySelector('.pm-alert');
        if(box){ box.className='pm-alert show '+(ok?'pm-alert--ok':'pm-alert--err'); box.textContent=ok?t('ok'):t('err'); }
        if(btn){ btn.disabled=false; btn.style.opacity='1'; btn.innerHTML=html; }
        if(ok){ form.reset(); loadStatus(); }
      };
      if(!C.appsScriptUrl){ console.log('[ProMax demo] referral:',payload); setTimeout(function(){done(true);},500); return; }
      fetch(C.appsScriptUrl,{method:'POST',body:JSON.stringify(payload)})
        .then(function(r){return r.json().catch(function(){return{};});})
        .then(function(){done(true);})
        .catch(function(err){ console.error(err); done(false); });
    });
  }

  function start(){ initGate(); initForm(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
