// CALIDAD y CANTIDAD de fotos (queja real: International subia miniaturas
// pixeladas y solo 5): 1) entre variantes de la MISMA foto gana la mas
// grande / la original; 2) ya no se recorta a 5 (hasta 24); 3) DealerCenter
// (imagescf.dealercenter.net/W/H/...) se normaliza a /1280/960/ porque el
// dealer pide cajas de 279x208 y el CDN redimensiona al vuelo (verificado).
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs');
const R=[]; function ck(n,ok,i){R.push([ok]);console.log((ok?'PASS':'FAIL')+'  '+n+(!ok&&i?'  ['+i+']':''));}

/* ---- unit: promaxUpsize (sin navegador) ---- */
const ENG = require(require('path').join(__dirname,'..','engine.js'));
ck('upsize: caja chica plana -> /1280/960/',
  ENG.promaxUpsize('https://imagescf.dealercenter.net/279/208/202607-abc.jpg')==='https://imagescf.dealercenter.net/1280/960/202607-abc.jpg');
ck('upsize: forma con carpeta -> /1280/960/',
  ENG.promaxUpsize('https://imagescf.dealercenter.net/279/208/202503-veh/202503-foto.jpg')==='https://imagescf.dealercenter.net/1280/960/202503-veh/202503-foto.jpg');
ck('upsize: caja ya grande TAMBIEN se normaliza (evita duplicados)',
  ENG.promaxUpsize('https://imagescf.dealercenter.net/0/0/202607-abc.jpg')==='https://imagescf.dealercenter.net/1280/960/202607-abc.jpg');
ck('upsize: otros hosts NO se tocan',
  ENG.promaxUpsize('https://cdn.ebz.com/media/used/ABC1_320x240.jpg')==='https://cdn.ebz.com/media/used/ABC1_320x240.jpg');
ck('upsize: dealercenter SIN caja numerica no se toca',
  ENG.promaxUpsize('https://imagescf.dealercenter.net/logo/202607-abc.jpg')==='https://imagescf.dealercenter.net/logo/202607-abc.jpg');

/* ---- fixture A (eBizAutos): miniaturas 320x240 visibles, grandes en links ---- */
let thumbs='', links='';
for (let i=1;i<=8;i++){
  thumbs += `<div class="gallery"><img src="https://cdn.ebz.com/media/used/ABC${i}_320x240.jpg"></div>`;
  links  += `<a href="https://cdn.ebz.com/media/used/ABC${i}_1024x768.jpg">ver</a>`;
}
links += `<a href="https://cdn.ebz.com/media/used/ABC1.jpg">original</a>`; // misma foto 1 SIN tamano
const HTML_A = `<html><base href="https://www.internationalcarsusa.com/x/"><body>
 <h1>2022 FORD F250 SUPER DUTY</h1><div>Vehicle Price: $55,900</div><div>VIN 1FT7W2BT8KEE15735</div>
 ${thumbs}${links}</body></html>`;

/* ---- fixture B (DealerCenter FLAT, como Silverado/F150 reales): JSON-LD con
   miniaturas /279/208/ + og:image con la MISMA foto 1 en /640/480/ ---- */
const G1='202607-aaaa1111aaaa1111aaaa1111aaaa1111';
const G2='202607-bbbb2222bbbb2222bbbb2222bbbb2222';
const G3='202607-cccc3333cccc3333cccc3333cccc3333';
const LD_B = JSON.stringify({'@type':'Vehicle', name:'2023 CHEVROLET SILVERADO', description:'Camioneta de trabajo lista, un solo dueno, mantenimientos al dia.',
  image:[`https://imagescf.dealercenter.net/279/208/${G1}.jpg`,`https://imagescf.dealercenter.net/279/208/${G2}.jpg`,`https://imagescf.dealercenter.net/279/208/${G3}.jpg`]});
const HTML_B = `<html><base href="https://www.internationalcarsusa.com/y/"><head>
 <meta property="og:image" content="https://imagescf.dealercenter.net/640/480/${G1}.jpg">
 <script type="application/ld+json">${LD_B}</script></head><body>
 <h1>2023 CHEVROLET SILVERADO</h1><div>$38,900</div></body></html>`;

/* ---- fixture C (DealerCenter con CARPETA por vehiculo, como el Suburban) ---- */
const VEH='202503-9fc8f9dd432a411e8883ce92655ce434';
const LD_C = JSON.stringify({'@type':'Vehicle', name:'2022 CHEVROLET SUBURBAN', description:'SUV grande para familia, tres filas, motor V8 recien servido.',
  image:[`https://imagescf.dealercenter.net/279/208/${VEH}/202503-f0t01111aaaa1111aaaa1111aaaa1111.jpg`,`https://imagescf.dealercenter.net/279/208/${VEH}/202503-f0t02222bbbb2222bbbb2222bbbb2222.jpg`]});
const HTML_C = `<html><base href="https://www.internationalcarsusa.com/z/"><head>
 <script type="application/ld+json">${LD_C}</script></head><body>
 <h1>2022 CHEVROLET SUBURBAN</h1><div>$52,500</div></body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PROMAX_CHROMIUM || undefined, args: ['--no-sandbox'] });
  const { strip } = require(require('path').join(__dirname,'..','build-bookmarklets-lib.js'));
  const eng = fs.readFileSync(require('path').join(__dirname,'..','engine.js'),'utf8');
  for (const [label, SRC] of [['engine.js', eng], ['engine.min (bookmarklet)', strip(eng)]]){
    const p = await b.newPage();
    await p.setContent(HTML_A);
    await p.evaluate('(function(){' + SRC + ';window.__M=promaxDetailMedia;})()');
    const m = await p.evaluate(() => window.__M(document, location.href));
    const g = m.gallery || [];
    ck(label+': trae las 8 fotos (ya no se corta en 5)', g.length===8, 'n='+g.length);
    ck(label+': NINGUNA miniatura 320x240 en la galeria', g.every(u=>!/320x240/.test(u)), g.slice(0,3).join(' '));
    const f1 = g.filter(u=>/ABC1/.test(u));
    ck(label+': de la foto 1 gana la ORIGINAL sin tamaño', f1.length===1 && /ABC1\.jpg$/.test(f1[0]), JSON.stringify(f1));
    const f2 = g.filter(u=>/ABC2/.test(u));
    ck(label+': de la foto 2 gana la 1024x768', f2.length===1 && /1024x768/.test(f2[0]), JSON.stringify(f2));

    // DealerCenter plano
    await p.setContent(HTML_B);
    const mB = await p.evaluate(() => window.__M(document, location.href));
    const gB = mB.gallery || [];
    ck(label+': dealercenter plano: 3 fotos (og duplicada NO suma)', gB.length===3, JSON.stringify(gB));
    ck(label+': dealercenter plano: TODAS en /1280/960/ (ya no 279x208)', gB.length>0 && gB.every(u=>u.indexOf('/1280/960/')>-1), gB.join(' '));
    ck(label+': dealercenter plano: la foto 1 sale UNA sola vez', gB.filter(u=>u.indexOf(G1)>-1).length===1, gB.join(' '));

    // DealerCenter con carpeta por vehiculo
    await p.setContent(HTML_C);
    const mC = await p.evaluate(() => window.__M(document, location.href));
    const gC = mC.gallery || [];
    ck(label+': dealercenter carpeta: conserva las 2 fotos del vehiculo', gC.length===2, JSON.stringify(gC));
    ck(label+': dealercenter carpeta: reescritas a /1280/960/', gC.length>0 && gC.every(u=>u.indexOf('/1280/960/'+VEH+'/')>-1), gC.join(' '));
    await p.close();
  }
  await b.close();
  const f=R.filter(x=>!x[0]).length;
  console.log('\n===== '+(R.length-f)+'/'+R.length+' PASS =====');
  process.exit(f?1:0);
})().catch(e=>{console.log('FATAL',e.message);process.exit(1);});
