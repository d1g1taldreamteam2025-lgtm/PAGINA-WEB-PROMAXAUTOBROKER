/* =========================================================================
   PROMAX AUTO BROKER — INVENTARIO
   - Carga /assets/data/inventory.json (Jorge lo edita para añadir vehículos).
   - Si existe #pmFeatTrack  -> renderiza carrusel de destacados (home).
   - Si existe #pmInvGrid     -> renderiza inventario completo con filtros.
   ========================================================================= */
(function(){
  var C = window.PROMAX_CONFIG || {};
  var I = window.PROMAX_I18N;
  var DATA = [];

  /* --- etiquetas traducibles --- */
  var L = {
    type:{ es:{auto:"Auto",suv:"SUV",camioneta:"Camioneta",chuto:"Chuto",moto:"Moto",van:"Van"},
           en:{auto:"Car",suv:"SUV",camioneta:"Pickup",chuto:"Semi-Truck",moto:"Motorcycle",van:"Van"} },
    typeIcon:{auto:"directions_car",suv:"airport_shuttle",camioneta:"local_shipping",chuto:"local_shipping",moto:"two_wheeler",van:"airport_shuttle"},
    cond:{ es:{new:"Nuevo",used:"Usado"}, en:{new:"New",used:"Used"} },
    fuel:{ es:{}, en:{"Gasolina":"Gasoline","Diésel":"Diesel","Híbrido":"Hybrid","Eléctrico":"Electric"} },
    loc:{ es:{USA:"En USA",Venezuela:"En Venezuela"}, en:{USA:"In USA",Venezuela:"In Venezuela"} },
    ui:{
      es:{ price_from:"Desde", per_month:"/mes", mi:"mi", want:"Lo Quiero", prequalify:"Pre-Calificar",
           results:"vehículos", empty_t:"No hay vehículos que coincidan", empty_p:"Ajusta los filtros o explora todo el inventario", reset:"Reiniciar",
           search_ph:"Buscar por marca, modelo, año...", sort_new:"Más recientes", sort_pl:"Precio: bajo → alto", sort_ph:"Precio: alto → bajo",
           f_all:"Todos", f_make:"Marca", f_cond:"Condición", f_loc:"Ubicación", f_price:"Precio", refine:"Filtrar", min:"Mín", max:"Máx", filters:"Filtros", loading:"Cargando vehículos..." },
      en:{ price_from:"From", per_month:"/mo", mi:"mi", want:"I Want It", prequalify:"Pre-Qualify",
           results:"vehicles", empty_t:"No vehicles match", empty_p:"Adjust the filters or browse all inventory", reset:"Reset",
           search_ph:"Search by make, model, year...", sort_new:"Newest", sort_pl:"Price: low → high", sort_ph:"Price: high → low",
           f_all:"All", f_make:"Make", f_cond:"Condition", f_loc:"Location", f_price:"Price", refine:"Refine", min:"Min", max:"Max", filters:"Filters", loading:"Loading vehicles..." }
    }
  };
  function lang(){ return I ? I.get() : 'es'; }
  function ui(k){ var l=lang(); return (L.ui[l]&&L.ui[l][k]) || L.ui.es[k] || k; }
  function typeLabel(t){ var l=lang(); return (L.type[l]&&L.type[l][t]) || L.type.es[t] || t; }
  function condLabel(c){ var l=lang(); return (L.cond[l]&&L.cond[l][c]) || L.cond.es[c] || c; }
  function fuelLabel(f){ var l=lang(); return (L.fuel[l]&&L.fuel[l][f]) || f; }
  function fmt(n){ return (Number(n)||0).toLocaleString('en-US'); }

  function waForVehicle(v){
    var l = lang();
    var title = v.year+' '+v.make+' '+v.model+(v.trim?(' '+v.trim):'');
    var msg = (l==='en')
      ? "Hi ProMax, I'm interested in the "+title+". Can you give me more info?"
      : "Hola ProMax, me interesa el "+title+". ¿Me das más información?";
    return "https://wa.me/"+(C.whatsappNumber||'')+"?text="+encodeURIComponent(msg);
  }
  function priceHTML(v){
    if(v.priceUnit==='month') return '<span class="pm-car__price-label">'+ui('price_from')+'</span><span class="pm-car__price">$'+fmt(v.price)+'<small style="font-size:14px;color:var(--pm-muted);">'+ui('per_month')+'</small></span>';
    return '<span class="pm-car__price-label">'+condLabel(v.condition)+'</span><span class="pm-car__price">$'+fmt(v.price)+'</span>';
  }

  function card(v){
    var title = v.year+' '+v.make+' '+v.model;
    var img = v.image
      ? '<div class="pm-car__img" style="background-image:url(\''+v.image+'\')">'
      : '<div class="pm-car__img pm-car__img--ph"><span class="material-icons-outlined">'+(L.typeIcon[v.type]||'directions_car')+'</span>';
    return '<article class="pm-car">'+
      img +
        (v.badge?'<span class="pm-car__badge">'+v.badge+'</span>':'')+
        '<span class="pm-car__type"><span class="material-icons-outlined">'+(L.typeIcon[v.type]||'directions_car')+'</span>'+typeLabel(v.type)+'</span>'+
      '</div>'+
      '<div class="pm-car__body">'+
        '<h3 class="pm-car__title">'+title+'</h3>'+
        '<p class="pm-car__sub">'+(v.trim||'')+(v.trim?' · ':'')+(L.loc[lang()][v.location]||v.location)+'</p>'+
        '<div class="pm-car__specs">'+
          '<span class="pm-car__spec"><span class="material-icons-outlined">speed</span>'+(v.mileage>0?fmt(v.mileage)+' '+ui('mi'):condLabel(v.condition))+'</span>'+
          '<span class="pm-car__spec"><span class="material-icons-outlined">local_gas_station</span>'+fuelLabel(v.fuel)+'</span>'+
          '<span class="pm-car__spec"><span class="material-icons-outlined">settings</span>'+(v.transmission||'-')+'</span>'+
          '<span class="pm-car__spec"><span class="material-icons-outlined">trending_up</span>'+(v.drivetrain||'-')+'</span>'+
        '</div>'+
        '<div class="pm-car__price-row"><div>'+priceHTML(v)+'</div></div>'+
        '<div class="pm-car__actions">'+
          '<a href="'+waForVehicle(v)+'" target="_blank" rel="noopener" class="pm-btn pm-btn--primary">'+ui('want')+'</a>'+
          '<a href="/financiamiento/aplicar/?v='+encodeURIComponent(v.id)+'" class="pm-btn pm-btn--ghost">'+ui('prequalify')+'</a>'+
        '</div>'+
      '</div></article>';
  }

  function load(){
    return fetch('/assets/data/inventory.json',{cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(rows){ DATA = Array.isArray(rows)?rows:[]; return DATA; })
      .catch(function(e){ console.error('Inventario:',e); DATA=[]; return DATA; });
  }

  /* ====================== HOME: carrusel destacados ====================== */
  function initFeatured(){
    var track = document.getElementById('pmFeatTrack');
    if(!track) return;
    track.innerHTML = '<div style="padding:60px;text-align:center;color:#999;width:100%">'+ui('loading')+'</div>';
    load().then(function(){
      var feat = DATA.filter(function(v){return v.featured;});
      if(feat.length < 3) feat = DATA.slice(0,6);
      else feat = feat.slice(0,8);
      if(!feat.length){ track.innerHTML='<div style="padding:60px;text-align:center;color:#999;width:100%">—</div>'; return; }
      function paint(){ track.innerHTML = feat.map(card).join(''); }
      paint();
      window.addEventListener('promax-lang-change', paint);

      var idx=0;
      function per(){ return window.innerWidth<=640?1:(window.innerWidth<=980?2:3); }
      window.pmFeatSlide = function(d){
        var n=feat.length, p=per(), max=Math.max(0,n-p);
        idx+=d; if(idx<0)idx=max; if(idx>max)idx=0;
        var first=track.children[0]; if(!first||!first.offsetWidth)return;
        track.style.transform='translateX(-'+(idx*(first.offsetWidth+24))+'px)';
      };
      window.addEventListener('resize',function(){
        var p=per(), max=Math.max(0,feat.length-p); if(idx>max)idx=max;
        var first=track.children[0]; if(first&&first.offsetWidth) track.style.transform='translateX(-'+(idx*(first.offsetWidth+24))+'px)';
      });
    });
  }

  /* ====================== PÁGINA INVENTARIO ====================== */
  var state = { quick:'all', search:'', sort:'new', make:[], cond:[], loc:[], pmin:null, pmax:null };

  function applyFilters(){
    var r = DATA.slice();
    if(state.quick!=='all') r = r.filter(function(v){return v.type===state.quick;});
    if(state.search){ var q=state.search.toLowerCase(); r=r.filter(function(v){return (v.year+' '+v.make+' '+v.model+' '+(v.trim||'')).toLowerCase().indexOf(q)>-1;}); }
    if(state.make.length) r=r.filter(function(v){return state.make.indexOf(v.make)>-1;});
    if(state.cond.length) r=r.filter(function(v){return state.cond.indexOf(v.condition)>-1;});
    if(state.loc.length)  r=r.filter(function(v){return state.loc.indexOf(v.location)>-1;});
    // precio solo para totales (no comparamos mensualidades con totales)
    if(state.pmin!=null) r=r.filter(function(v){return v.priceUnit==='total' ? v.price>=state.pmin : true;});
    if(state.pmax!=null) r=r.filter(function(v){return v.priceUnit==='total' ? v.price<=state.pmax : true;});
    switch(state.sort){
      case 'pl': r.sort(function(a,b){return (a.priceUnit==='total'?a.price:1e9)-(b.priceUnit==='total'?b.price:1e9);}); break;
      case 'ph': r.sort(function(a,b){return (b.priceUnit==='total'?b.price:0)-(a.priceUnit==='total'?a.price:0);}); break;
      default: r.sort(function(a,b){return b.year-a.year;});
    }
    return r;
  }

  function buildSidebar(){
    var byKey=function(key){ var o={}; DATA.forEach(function(v){var k=v[key]; if(k)o[k]=(o[k]||0)+1;}); return o; };
    var makes=byKey('make');
    var mk = Object.keys(makes).sort().map(function(m){
      return '<label class="pm-check"><input type="checkbox" data-f="make" value="'+m+'"><span>'+m+'</span><span class="count">'+makes[m]+'</span></label>';
    }).join('');
    document.getElementById('pmFMake').innerHTML = mk;

    document.getElementById('pmFCond').innerHTML =
      '<label class="pm-check"><input type="checkbox" data-f="cond" value="new"><span>'+condLabel('new')+'</span></label>'+
      '<label class="pm-check"><input type="checkbox" data-f="cond" value="used"><span>'+condLabel('used')+'</span></label>';
    document.getElementById('pmFLoc').innerHTML =
      '<label class="pm-check"><input type="checkbox" data-f="loc" value="USA"><span>'+(L.loc[lang()].USA)+'</span></label>'+
      '<label class="pm-check"><input type="checkbox" data-f="loc" value="Venezuela"><span>'+(L.loc[lang()].Venezuela)+'</span></label>';

    document.querySelectorAll('#pmSidebar input[type=checkbox]').forEach(function(inp){
      inp.addEventListener('change',function(){
        var f=inp.dataset.f, v=inp.value;
        if(inp.checked){ if(state[f].indexOf(v)<0) state[f].push(v); }
        else state[f]=state[f].filter(function(x){return x!==v;});
        render();
      });
    });
  }

  function render(){
    var grid=document.getElementById('pmInvGrid'); if(!grid) return;
    var r=applyFilters();
    document.getElementById('pmInvCount').textContent=r.length;
    var stat=document.getElementById('pmStatCount'); if(stat) stat.textContent=DATA.length;
    if(!r.length){
      grid.innerHTML='<div class="pm-inv__empty"><span class="material-icons-outlined">search_off</span><h3>'+ui('empty_t')+'</h3><p>'+ui('empty_p')+'</p><button class="pm-btn pm-btn--primary" onclick="pmInvReset()">'+ui('reset')+'</button></div>';
    } else {
      grid.innerHTML=r.map(card).join('');
    }
  }
  window.pmInvReset=function(){
    state={quick:'all',search:'',sort:'new',make:[],cond:[],loc:[],pmin:null,pmax:null};
    document.querySelectorAll('.pm-qf button').forEach(function(b){b.classList.toggle('active',b.dataset.quick==='all');});
    document.querySelectorAll('#pmSidebar input[type=checkbox]').forEach(function(i){i.checked=false;});
    document.querySelectorAll('#pmSidebar input[type=number]').forEach(function(i){i.value='';});
    var s=document.getElementById('pmSearch'); if(s)s.value='';
    render();
  };

  function initInventory(){
    var grid=document.getElementById('pmInvGrid'); if(!grid) return;
    grid.innerHTML='<div class="pm-inv__empty"><span class="material-icons-outlined">hourglass_top</span><h3>'+ui('loading')+'</h3></div>';
    load().then(function(){
      buildSidebar();
      // quick filters
      var url=new URLSearchParams(location.search);
      if(url.get('tipo')) state.quick=url.get('tipo');
      document.querySelectorAll('.pm-qf button').forEach(function(b){
        b.classList.toggle('active', b.dataset.quick===state.quick);
        b.addEventListener('click',function(){
          document.querySelectorAll('.pm-qf button').forEach(function(x){x.classList.remove('active');});
          b.classList.add('active'); state.quick=b.dataset.quick; render();
        });
      });
      var s=document.getElementById('pmSearch'); if(s) s.addEventListener('input',function(){state.search=s.value.trim();render();});
      var sort=document.getElementById('pmSort'); if(sort) sort.addEventListener('change',function(){state.sort=sort.value;render();});
      var pmin=document.getElementById('pmPmin'); if(pmin) pmin.addEventListener('change',function(){state.pmin=pmin.value?+pmin.value:null;render();});
      var pmax=document.getElementById('pmPmax'); if(pmax) pmax.addEventListener('change',function(){state.pmax=pmax.value?+pmax.value:null;render();});
      // sidebar móvil
      var sb=document.getElementById('pmSidebar'), ov=document.getElementById('pmInvOverlay');
      var fb=document.getElementById('pmFilterBtn');
      if(fb&&sb&&ov){
        fb.addEventListener('click',function(){sb.classList.add('open');ov.classList.add('visible');document.body.style.overflow='hidden';});
        function close(){sb.classList.remove('open');ov.classList.remove('visible');document.body.style.overflow='';}
        ov.addEventListener('click',close);
        var x=document.getElementById('pmSidebarClose'); if(x)x.addEventListener('click',close);
      }
      render();
      window.addEventListener('promax-lang-change',function(){ buildSidebar(); render(); });
    });
  }

  function start(){ initFeatured(); initInventory(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
