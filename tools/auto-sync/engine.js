/* ================= PROMAX — Extractor UNIVERSAL v3 =================
   Lee inventario de varias plataformas de dealer (microdata/hgreg,
   DealerCenter, Dealer Car Search, Dealer Spike) desde la pagina de
   LISTADO, en el navegador real del usuario (pasa antibots).
   v3: ademas RECORRE todas las paginas del listado y ENTRA a la ficha
   de cada vehiculo para traer hasta 5 FOTOS reales + descripcion.
   Filtra por anio (2020+, camiones 2022+) y mapea a las 6 categorias.
   ==================================================================== */
function promaxExtract(opts, root){
  opts = opts || {};
  root = root || document;
  var baseUrl = opts.baseUrl || location.href;
  var host = (opts.host || location.hostname || '').replace(/^www\./,'').toLowerCase();
  var isTrucks = (opts.isTrucks != null) ? opts.isTrucks : /truck/.test(host);
  var isPower  = (opts.isPower  != null) ? opts.isPower  : /(moto|powersport|marine|cycle|spike)/.test(host);
  var MINYEAR  = opts.minYear || (isTrucks ? 2022 : 2020);
  var source   = opts.source || host || 'dealer';
  var VIN17 = /\b[A-HJ-NPR-Z0-9]{17}\b/;
  function qsa(sel, r){ try{ return Array.prototype.slice.call((r||root).querySelectorAll(sel)); }catch(e){ return []; } }
  function txt(el){ return ((el && (el.innerText||el.textContent))||'').replace(/ /g,' ').replace(/[ \t]+/g,' ').trim(); }
  function digits(s){ s=String(s==null?'':s); var o=''; for(var i=0;i<s.length;i++){var c=s.charAt(i); if(c>='0'&&c<='9')o+=c;} return o; }
  function N(s){ var n=parseInt(digits(s),10); return isNaN(n)?0:n; }
  function has(s,t){ return String(s||'').toLowerCase().indexOf(String(t).toLowerCase())>-1; }
  function ip(el,name){ var n=el.querySelector('[itemprop="'+name+'"]'); if(!n)return ''; return (n.getAttribute('content')||n.textContent||'').trim(); }
  function abs(u, base){ if(!u) return ''; try{ return new URL(u, base||baseUrl).href; }catch(e){ return ''; } }
  function vinsIn(t){ var m=String(t).match(/[A-HJ-NPR-Z0-9]{17}/g)||[]; var u={},k; for(k=0;k<m.length;k++)u[m[k]]=1; return Object.keys(u).length; }
  // Sube desde un elemento chico (p.ej. el que tiene data-vin en DealerCenter,
  // sin texto) hasta la TARJETA real que contiene año + datos del vehiculo.
  function growCard(el){
    var t0=txt(el);
    if(/\b(19|20)\d\d\b/.test(t0) && t0.length<6000) return el;
    var node=el.parentElement, up=0;
    for(; node && up<9; up++){
      var t=txt(node);
      if(/\b(19|20)\d\d\b/.test(t) && t.length<6000 && vinsIn(t)<=1) return node;
      node=node.parentElement;
    }
    return el;
  }

  function cardish(el){
    // Señales ESTRUCTURALES = es una tarjeta de vehiculo (funciona aunque el
    // texto venga pegado sin espacios, como en documentos traidos por fetch).
    if(el.getAttribute){
      if(/Vehicle/i.test(el.getAttribute('itemtype')||'')) return true;
      if(el.getAttribute('data-vin')||el.getAttribute('data-vehicle')) return true;
    }
    if(el.querySelector && (el.querySelector('[itemprop="vehicleIdentificationNumber"]')||el.querySelector('[itemprop="name"]')&&el.querySelector('[itemprop="price"]'))) return true;
    var t = txt(el);
    if(!/\b(19|20)\d\d\b/.test(t)) return false;
    if(t.indexOf('$')<0 && !VIN17.test(t)) return false;
    if(t.length>4500) return false;
    return true;
  }
  var anchors = [];
  var SELS = ['[itemtype*="Vehicle"]','[data-vin]','[data-vehicle]','article','[class*="vehicle-card"]','[class*="vehiclecard"]','[class*="inventory-card"]','li[class*="listing"]','.vehicle'];
  // Elegimos el selector que produzca MAS tarjetas de vehiculo (cardish),
  // no el primero con >=3 — asi funciona con 1, 2 o miles de carros por pagina.
  var bestN=0;
  for(var i=0;i<SELS.length;i++){ var els=qsa(SELS[i]).filter(cardish); if(els.length>bestN){ bestN=els.length; anchors=els; } }
  if(anchors.length<3){
    var pool = qsa('div,li,article,tr,section'), byVin={};
    for(var p=0;p<pool.length;p++){
      var el=pool[p], t=(el.innerText||el.textContent||''); var m=t.match(VIN17); if(!m) continue;
      if(t.indexOf('$')<0) continue;
      var all=t.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g)||[], u={}; all.forEach(function(v){u[v]=1;});
      if(Object.keys(u).length!==1) continue;
      var vin=m[0];
      if(!byVin[vin] || t.length < ((byVin[vin].innerText||byVin[vin].textContent)||'').length) byVin[vin]=el;
    }
    var vc = Object.keys(byVin).map(function(v){return byVin[v];});
    if(vc.length>anchors.length) anchors=vc;
  }
  // Crecer cada ancla a su tarjeta real y deduplicar por elemento (clave para
  // DealerCenter, donde el ancla data-vin no contiene el texto del vehiculo).
  if(anchors.length){
    var grown=[], gArr=[];
    for(var gi=0; gi<anchors.length; gi++){
      var ce=growCard(anchors[gi]);
      if(gArr.indexOf(ce)>-1) continue;
      gArr.push(ce); grown.push(ce);
    }
    anchors=grown;
  }

  function badImg(u){ return /(logo|placeholder|no[-_]?image|noimage|spacer|blank|coming[-_]?soon|icon|sprite|badge|carfax|autocheck|button|arrow|flag|banner|award|certif|warranty|\.svg|\.gif)/i.test(u); }
  function images(el){
    var out=[], seen={};
    function add(u){ if(!u||/^data:/.test(u)) return; if(badImg(u)) return; u=u.split('?')[0]; u=abs(u); if(u && !seen[u]){ seen[u]=1; out.push(u); } }
    qsa('img',el).forEach(function(im){
      var u=im.getAttribute('src')||im.getAttribute('data-src')||im.getAttribute('data-original')||im.getAttribute('data-lazy')||im.getAttribute('data-echo')||'';
      if(!u){ var ss=im.getAttribute('srcset')||im.getAttribute('data-srcset'); if(ss) u=ss.split(',')[0].trim().split(' ')[0]; }
      add(u);
    });
    qsa('[style*="background-image"]',el).forEach(function(n){
      var m=/url\(["']?([^"')]+)["']?\)/.exec(n.getAttribute('style')||''); if(m) add(m[1]);
    });
    return out.slice(0,5);
  }
  function detailUrl(el){
    var a=el.querySelector('a[itemprop="url"],a[href*="inventory"],a[href*="used"],a[href*="vehicle"],a[href*="detail"],a[href*="for-sale"],a[href]');
    return a ? abs(a.getAttribute('href')) : '';
  }
  var COL={black:'Negro',white:'Blanco',gray:'Gris',grey:'Gris',silver:'Plata',red:'Rojo',blue:'Azul',green:'Verde',brown:'Marron',beige:'Beige',gold:'Dorado',orange:'Naranja',yellow:'Amarillo',tan:'Habano',maroon:'Granate',charcoal:'Grafito',burgundy:'Vino',purple:'Morado'};
  var TWO={land:'rover',mercedes:'benz',aston:'martin',alfa:'romeo'};
  function catFor(U, body){
    if(isPower){
      if(/JET\s?SKI|WAVERUNNER|SEA[- ]?DOO|WATERCRAFT|\bPWC\b|PERSONAL WATERCRAFT|\bBOAT\b|SPORT BOAT/.test(U)) return 'watercraft';
      if(/\bUTV\b|SIDE[- ]?BY[- ]?SIDE|\bRZR\b|\bATV\b|MAVERICK|\bRANGER\b|\bMULE\b|COMMANDER|WOLVERINE|TERYX|PIONEER/.test(U)) return 'utv';
      return 'motorcycles';
    }
    if(isTrucks) return 'trucks_machinery';
    if(body==='Van') return 'vans';
    if(/PETERBILT|KENWORTH|FREIGHTLINER|\bMACK\b|\bHINO\b|WESTERN STAR/.test(U)) return 'trucks_machinery';
    return 'cars';
  }

  function parseOne(el){
    var T=txt(el), U=T.toUpperCase();
    // VIN robusto: atributo propio, atributo de un hijo (DealerCenter pone
    // data-vin en botones), microdata, y por ultimo texto con etiqueta "VIN:"
    // (sin exigir limite final, porque en docs traidos por fetch el texto se
    // pega: "...207170Price").
    var vin=(el.getAttribute&&(el.getAttribute('data-vin')||''))||'';
    if(!vin){ var _dv=el.querySelector&&el.querySelector('[data-vin]'); if(_dv) vin=_dv.getAttribute('data-vin')||''; }
    if(!vin) vin=ip(el,'vehicleIdentificationNumber');
    if(!vin){ var _mv=T.match(/VIN[:#\s]*([A-HJ-NPR-Z0-9]{17})/i)||T.match(VIN17); if(_mv) vin=_mv[1]||_mv[0]; }
    vin = vin?vin.toUpperCase():'';
    var name=ip(el,'name');
    if(!name){ var h=el.querySelector('h1,h2,h3,h4,[class*="title"],[class*="name"]'); name=h?txt(h):''; }
    if(!/\b(19|20)\d\d\b/.test(name)){ var yl=T.match(/(?:^|\n|>)\s*((19|20)\d\d\s+[A-Za-z][^\n$]{2,50})/); if(yl) name=yl[1]; }
    name=name.replace(/vehicle price[:\s].*$/i,'').replace(/\$[\d,]+.*/,'').replace(/\s+/g,' ').trim();
    var yr=(name.match(/\b(19|20)\d\d\b/)||T.match(/\b(19|20)\d\d\b/)||[''])[0];
    var year=parseInt(yr,10)||null;
    var rest=name.replace(/\b(19|20)\d\d\b/,'').replace(/\s+/g,' ').trim();
    var toks=rest.split(' ').filter(Boolean);
    var make=ip(el,'brand')||ip(el,'manufacturer')||(toks[0]||'');
    var model=ip(el,'model')||(toks[1]||'');
    var trim=toks.slice(2).join(' ');
    if(toks[0] && TWO[toks[0].toLowerCase()] && toks[1] && toks[1].toLowerCase().replace(/-/g,'')===TWO[toks[0].toLowerCase()]){
      make=toks[0]+' '+toks[1]; model=toks[2]||''; trim=toks.slice(3).join(' ');
    }
    var price=N(ip(el,'price'));
    if(price<1000){ var pl=T.match(/(?:price|precio)[:\s]*\$?\s*([\d,]{4,})/i); if(pl) price=N(pl[1]); }
    if(price<1000){ var a$=(T.match(/\$\s*[\d,]{4,}/g)||[]).map(N).filter(function(n){return n>1000&&n<600000;}); if(a$.length) price=Math.max.apply(null,a$); }
    var mileage=0; var mm=T.match(/([\d,]{1,7})\s*(?:mi\b|miles|millas)/i)||T.match(/(?:mileage|millaje|odometer)[:\s]*([\d,]{1,7})/i); if(mm) mileage=N(mm[1]);
    var body=(has(U,'SUV')||has(U,'SPORT UTILITY')||has(U,'CROSSOVER'))?'SUV':(has(U,'PICKUP')||has(U,'CREW CAB')||has(U,'REG CAB')||has(U,'EXT CAB')||/\bTRUCK\b/.test(U))?'Truck':(has(U,'MINIVAN')||has(U,'CARGO VAN')||has(U,'PASSENGER VAN')||/\bVAN\b/.test(U))?'Van':has(U,'COUPE')?'Coupe':(has(U,'HATCHBACK')||has(U,'HATCH'))?'Hatchback':has(U,'WAGON')?'Wagon':(has(U,'CONVERTIBLE')||has(U,'CABRIO')||has(U,'ROADSTER'))?'Convertible':has(U,'SEDAN')?'Sedan':'';
    var ib=ip(el,'bodyType'); if(!body&&ib) body=ib.charAt(0).toUpperCase()+ib.slice(1).toLowerCase();
    var fuel=has(U,'ELECTRIC')?'Electric':has(U,'HYBRID')?'Hybrid':has(U,'DIESEL')?'Diesel':has(U,'FLEX')?'Flex':(has(U,'GASOLINE')||has(U,'GAS')||has(U,'PETROL'))?'Gasoline':'';
    var trans=has(U,'MANUAL')?'Manual':(has(U,'CVT')||has(U,'VARIABLE'))?'Automatica (CVT)':(has(U,'AUTOMATIC')||has(U,'AUTOMATICA')||has(U,'AUTO '))?'Automatica':'';
    var drive=(/\bAWD\b|ALL[- ]?WHEEL/.test(U))?'AWD':(/\b4WD\b|\b4X4\b|FOUR[- ]?WHEEL/.test(U))?'4WD':(/\bRWD\b|REAR[- ]?WHEEL/.test(U))?'RWD':(/\bFWD\b|FRONT[- ]?WHEEL/.test(U))?'FWD':'';
    var ext=''; var cm=T.match(/ext(?:erior)?(?:\s*color)?[:\s]+([A-Za-z]+)/i); if(cm){var c=cm[1].toLowerCase(); ext=COL[c]||cm[1];}
    var g=images(el);
    var id=vin||((year&&make&&model)?(year+'-'+make+'-'+model+(trim?'-'+trim:'')):'');
    return { _year:year, id:id, year:year, make:make, model:model, trim:trim, body_type:body||'Sedan',
      category:catFor(U,body), status:'available',
      condition:(has(U,'NEW ')&&!has(U,'PRE-OWNED')&&!has(U,'USED')&&!has(U,'CERTIFIED'))?'new':'used',
      price:price||0, msrp:null, mileage:mileage||0, fuel:fuel, transmission:trans, drivetrain:drive,
      exterior_color:ext, interior_color:'', vin:vin, stock:'', badge:has(U,'CERTIFIED')?'Certificado':'',
      featured:false, features:[], description:'', gallery:g, cover_image:g[0]||'', source:source, source_url:detailUrl(el) };
  }

  var rows=[], seen={};
  for(var a=0;a<anchors.length;a++){
    var r; try{ r=parseOne(anchors[a]); }catch(e){ continue; }
    if(!r || (!r.make && !r.vin)) continue;
    if(r._year && r._year < MINYEAR) continue;
    var key=r.vin||r.id; if(key){ if(seen[key]) continue; seen[key]=1; }
    delete r._year; rows.push(r);
  }
  return rows;
}

/* ---- FOTOS de la ficha de un vehiculo (documento ya parseado) ---- */
function promaxDetailMedia(doc, pageUrl){
  function abs(u){ if(!u) return ''; try{ return new URL(u, pageUrl).href; }catch(e){ return ''; } }
  function bad(u){ return /(logo|placeholder|no[-_]?image|noimage|spacer|blank|coming[-_]?soon|icon|sprite|badge|carfax|autocheck|button|arrow|flag|banner|award|certif|warranty|dealer[-_]?logo|\.svg|\.gif)/i.test(u); }
  function baseKey(u){ return u.split('?')[0].replace(/(-|_)?\d{2,4}x\d{2,4}(?=\.)/,'').replace(/(-|_)(thumb|tn|small|tiny|mini)(?=\.)/i,''); }
  var out=[], seen={};
  function add(u){
    if(!u||/^data:/.test(u)) return;
    u=abs(String(u).trim()); if(!u||bad(u)) return;
    if(!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(u) && !/(photo|image|img|units|vehicle|inventory|imagescdn|pictures)/i.test(u)) return;
    var k=baseKey(u); if(seen[k]) return; seen[k]=1; out.push(u.split('?')[0]);
  }
  // 1) JSON-LD (schema.org Vehicle/Product)
  var lds=doc.querySelectorAll('script[type="application/ld+json"]');
  var desc='';
  for(var i=0;i<lds.length;i++){
    var data; try{ data=JSON.parse(lds[i].textContent); }catch(e){ continue; }
    (function walk(o,depth){
      if(!o||typeof o!=='object'||depth>4) return;
      if(Array.isArray(o)){ o.forEach(function(x){walk(x,depth+1);}); return; }
      var im=o.image||o.photo;
      if(im){ (Array.isArray(im)?im:[im]).forEach(function(x){ add(typeof x==='string'?x:(x&&(x.url||x.contentUrl))); }); }
      if(!desc && typeof o.description==='string' && o.description.length>30) desc=o.description;
      for(var k in o){ if(o[k]&&typeof o[k]==='object') walk(o[k],depth+1); }
    })(data,0);
  }
  // 2) og:image
  var ogs=doc.querySelectorAll('meta[property="og:image"],meta[name="og:image"]');
  for(var g2=0;g2<ogs.length;g2++) add(ogs[g2].getAttribute('content'));
  // 3) galerias tipicas
  var zones=doc.querySelectorAll('[class*="gallery"] img,[id*="gallery"] img,[class*="carousel"] img,[class*="slider"] img,[class*="slide"] img,figure img,[class*="photo"] img,[class*="media"] img');
  for(var z=0;z<zones.length;z++){
    var im2=zones[z];
    // preferir la foto REAL (data-src) sobre la miniatura de placeholder (src)
    add(im2.getAttribute('data-src')||im2.getAttribute('data-original')||im2.getAttribute('data-lazy')||im2.getAttribute('data-echo')||((im2.getAttribute('srcset')||im2.getAttribute('data-srcset')||'').split(',').pop()||'').trim().split(' ')[0]||im2.getAttribute('src'));
  }
  // 4) enlaces directos a fotos y resto de <img> grandes
  var links=doc.querySelectorAll('a[href*=".jpg"],a[href*=".jpeg"],a[href*=".png"],a[href*=".webp"]');
  for(var l=0;l<links.length;l++) add(links[l].getAttribute('href'));
  if(out.length<5){
    var alls=doc.querySelectorAll('img');
    for(var q=0;q<alls.length && out.length<12;q++){
      var a3=alls[q];
      add(a3.getAttribute('src')||a3.getAttribute('data-src'));
    }
  }
  if(!desc){ var md=doc.querySelector('meta[name="description"],meta[property="og:description"]'); if(md) desc=md.getAttribute('content')||''; }
  desc=String(desc||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,600);
  return { gallery: out.slice(0,5), description: desc };
}

/* ---- Recorre paginas + entra a cada ficha. onP(msg) reporta progreso ---- */
function promaxRunAll(opts, onP){
  opts=opts||{}; onP=onP||function(){};
  var maxPages = opts.maxPages || 300;
  var conc = opts.concurrency || 5;
  var wantDetails = opts.details !== false;
  var crawlAll = opts.pages === 'all';
  function fetchDoc(url){
    var ctrl = (typeof AbortController!=='undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function(){ try{ctrl.abort();}catch(e){} }, opts.timeoutMs||15000) : null;
    return fetch(url, {credentials:'same-origin', signal: ctrl?ctrl.signal:undefined})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
      .then(function(html){ return new DOMParser().parseFromString(html,'text/html'); })
      .finally(function(){ if(to) clearTimeout(to); });
  }
  function nextUrl(doc, curUrl, gotNew){
    var ln=doc.querySelector('link[rel="next"]'); if(ln&&ln.getAttribute('href')) return new URL(ln.getAttribute('href'),curUrl).href;
    var as=doc.querySelectorAll('a[rel="next"],a[class*="next"],a[aria-label*="ext"],a[aria-label*="iguiente"]');
    for(var i=0;i<as.length;i++){ var h=as[i].getAttribute('href'); if(h&&h!=='#'){ var u=new URL(h,curUrl).href; if(u!==curUrl) return u; } }
    var all=doc.querySelectorAll('a[href]');
    for(var j=0;j<all.length;j++){ var t=(all[j].textContent||'').trim().toLowerCase(); if(t==='next'||t==='siguiente'||t==='›'||t==='»'||t==='>'){ var h2=all[j].getAttribute('href'); if(h2&&h2!=='#'){ var u2=new URL(h2,curUrl).href; if(u2!==curUrl) return u2; } } }
    // "Page X of Y" (DealerCenter y muchos otros): si X<Y, ir a X+1
    try{
      var u3=new URL(curUrl);
      var param=u3.searchParams.has('pn')?'pn':'page';
      var cur=parseInt(u3.searchParams.get(param)||'1',10)||1;
      var bodyTxt=(doc.body&&(doc.body.innerText||doc.body.textContent))||'';
      var mt=bodyTxt.match(/page\s+(\d+)\s+of\s+(\d+)/i);
      if(mt){ var pg=parseInt(mt[1],10), tot=parseInt(mt[2],10); if(pg<tot){ u3.searchParams.set(param, String(pg+1)); return u3.href; } return ''; }
      if(gotNew){ u3.searchParams.set(param, String(cur+1)); return u3.href; }
    }catch(e){}
    return '';
  }
  var seen={}, rows=[];
  function merge(list){
    var added=0;
    list.forEach(function(r){ var k=r.vin||r.id||r.source_url; if(!k||seen[k]) return; seen[k]=1; rows.push(r); added++; });
    return added;
  }
  var startUrl=location.href;
  var p=Promise.resolve().then(function(){
    var first=promaxExtract(opts, document);
    var added=merge(first);
    onP('Pagina 1: '+rows.length+' vehiculos');
    if(!crawlAll || !added) return null;
    var visited={}; visited[startUrl.split('#')[0]]=1;
    var cur=nextUrl(document, startUrl, added>0), n=1;
    function step(){
      if(!cur || n>=maxPages) return null;
      var key=cur.split('#')[0];
      if(visited[key]) return null;
      visited[key]=1;
      try{ if(new URL(cur).host!==location.host) return null; }catch(e){ return null; }
      return fetchDoc(cur).then(function(doc){
        n++;
        var got=merge(promaxExtract({host:opts.host,isTrucks:opts.isTrucks,isPower:opts.isPower,minYear:opts.minYear,source:opts.source,baseUrl:cur}, doc));
        onP('Pagina '+n+': +'+got+' (total '+rows.length+')');
        if(!got) return null;
        cur=nextUrl(doc, cur, got>0);
        return step();
      }).catch(function(){ return null; });
    }
    return step();
  });
  if(wantDetails){
    p=p.then(function(){
      var withUrl=rows.filter(function(r){ return r.source_url; });
      var done=0, idx=0;
      onP('Buscando fotos de cada ficha (0/'+withUrl.length+')...');
      function worker(){
        if(idx>=withUrl.length) return Promise.resolve();
        var r=withUrl[idx++];
        return fetchDoc(r.source_url).then(function(doc){
          var m=promaxDetailMedia(doc, r.source_url);
          if(m.gallery.length){ r.gallery=m.gallery; r.cover_image=m.gallery[0]; }
          if(m.description && !r.description) r.description=m.description;
        }).catch(function(){}).then(function(){
          done++;
          if(done%5===0||done===withUrl.length) onP('Fotos: '+done+'/'+withUrl.length+' fichas leidas');
          return worker();
        });
      }
      var ws=[]; for(var w=0;w<conc;w++) ws.push(worker());
      return Promise.all(ws);
    });
  }
  return p.then(function(){ return rows; });
}
/* ---- FASE 3: sincroniza DIRECTO al panel (Supabase). No copia/pega. ----
   Sube (upsert por id) todos los vehiculos frescos y marca como VENDIDOS
   los de esa misma fuente que ya no aparecen (desaparecen del catalogo
   publico, que solo muestra status=available). Reversible. */
function promaxToDb(r, source, stamp){
  var g=Array.isArray(r.gallery)?r.gallery.slice(0,5):[];
  return { id:String(r.id||r.vin||(r.year+'-'+r.make+'-'+r.model)).toLowerCase().replace(/\s+/g,'-'),
    category:r.category||'cars', year:parseInt(r.year,10)||null, make:r.make||'', model:r.model||'', trim:r.trim||null,
    body_type:r.body_type||'Sedan', status:'available', condition:r.condition||'used',
    price:Number(r.price)||0, msrp:null, mileage:parseInt(r.mileage,10)||0,
    fuel:r.fuel||null, transmission:r.transmission||null, drivetrain:r.drivetrain||null,
    exterior_color:r.exterior_color||null, interior_color:null, vin:r.vin||null, stock:r.stock||null,
    badge:r.badge||null, featured:false, features:[], description:r.description||null,
    gallery:g, cover_image:r.cover_image||g[0]||null,
    source:source||r.source||null, source_url:r.source_url||null, last_sync:stamp };
}
/* Sube filas YA extraidas directo a Supabase (upsert + marca-vendidos).
   Separado de la extraccion para poder caer a "copiar al portapapeles"
   si el envio cross-origin lo bloquea CORS. */
function promaxUpload(rows, opts, onP){
  opts=opts||{}; onP=onP||function(){};
  var supaUrl=opts.supaUrl, supaKey=opts.supaKey, source=opts.source||(location.hostname||'').replace(/^www\./,'');
  var stamp=(opts.stamp)||(new Date().toISOString());
  var H={apikey:supaKey, Authorization:'Bearer '+supaKey, 'Content-Type':'application/json'};
  if(!rows || !rows.length) return Promise.reject(new Error('Nada que subir.'));
  var mapped=rows.map(function(r){ return promaxToDb(r, source, stamp); });
  var chunks=[]; for(var i=0;i<mapped.length;i+=100) chunks.push(mapped.slice(i,i+100));
  var done=0;
  function up(k){
    if(k>=chunks.length) return Promise.resolve();
    return fetch(supaUrl+'?on_conflict=id', {method:'POST', headers:Object.assign({}, H, {Prefer:'resolution=merge-duplicates,return=minimal'}), body:JSON.stringify(chunks[k])})
      .then(function(res){ if(!res.ok) return res.text().then(function(t){ throw new Error('Supabase '+res.status+': '+String(t).slice(0,180)); });
        done+=chunks[k].length; onP('Guardando en el panel: '+done+'/'+mapped.length); return up(k+1); });
  }
  return up(0).then(function(){
    onP('Marcando como vendidos los que ya no estan en el dealer...');
    return fetch(supaUrl+'?source=eq.'+encodeURIComponent(source)+'&status=eq.available&last_sync=lt.'+encodeURIComponent(stamp), {method:'PATCH', headers:Object.assign({}, H, {Prefer:'return=minimal'}), body:JSON.stringify({status:'sold'})})
      .then(function(res){ return { imported: mapped.length, retired: (res.ok?'ok':'?') }; });
  });
}
function promaxSync(opts, onP){
  opts=opts||{}; onP=onP||function(){};
  return promaxRunAll(opts, onP).then(function(rows){
    if(!rows.length) throw new Error('No se encontraron vehiculos para sincronizar. Abre la LISTA de inventario del dealer.');
    return promaxUpload(rows, opts, onP);
  });
}
if(typeof module!=='undefined') module.exports={promaxExtract:promaxExtract, promaxDetailMedia:promaxDetailMedia, promaxRunAll:promaxRunAll, promaxToDb:promaxToDb, promaxUpload:promaxUpload, promaxSync:promaxSync};
