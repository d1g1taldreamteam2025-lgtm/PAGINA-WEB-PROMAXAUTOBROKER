// CALIDAD y CANTIDAD de fotos (queja real: International subia miniaturas
// pixeladas y solo 5): 1) entre variantes de la MISMA foto gana la mas
// grande / la original; 2) ya no se recorta a 5 (hasta 24).
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs');
const R=[]; function ck(n,ok,i){R.push([ok]);console.log((ok?'PASS':'FAIL')+'  '+n+(!ok&&i?'  ['+i+']':''));}
// ficha estilo eBizAutos: miniaturas 320x240 en la galeria visible y las
// fotos GRANDES (1024x768 y original sin tamano) en los enlaces del lightbox
let thumbs='', links='';
for (let i=1;i<=8;i++){
  thumbs += `<div class="gallery"><img src="https://cdn.ebz.com/media/used/ABC${i}_320x240.jpg"></div>`;
  links  += `<a href="https://cdn.ebz.com/media/used/ABC${i}_1024x768.jpg">ver</a>`;
}
links += `<a href="https://cdn.ebz.com/media/used/ABC1.jpg">original</a>`; // misma foto 1 SIN tamano
const HTML = `<html><base href="https://www.internationalcarsusa.com/x/"><body>
 <h1>2022 FORD F250 SUPER DUTY</h1><div>Vehicle Price: $55,900</div><div>VIN 1FT7W2BT8KEE15735</div>
 ${thumbs}${links}</body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PROMAX_CHROMIUM || undefined, args: ['--no-sandbox'] });
  const { strip } = require(require('path').join(__dirname,'..','build-bookmarklets-lib.js'));
  const eng = fs.readFileSync(require('path').join(__dirname,'..','engine.js'),'utf8');
  for (const [label, SRC] of [['engine.js', eng], ['engine.min (bookmarklet)', strip(eng)]]){
    const p = await b.newPage();
    await p.setContent(HTML);
    await p.evaluate('(function(){' + SRC + ';window.__M=promaxDetailMedia;})()');
    const m = await p.evaluate(() => window.__M(document, location.href));
    const g = m.gallery || [];
    ck(label+': trae las 8 fotos (ya no se corta en 5)', g.length===8, 'n='+g.length);
    ck(label+': NINGUNA miniatura 320x240 en la galeria', g.every(u=>!/320x240/.test(u)), g.slice(0,3).join(' '));
    const f1 = g.filter(u=>/ABC1/.test(u));
    ck(label+': de la foto 1 gana la ORIGINAL sin tamaño', f1.length===1 && /ABC1\.jpg$/.test(f1[0]), JSON.stringify(f1));
    const f2 = g.filter(u=>/ABC2/.test(u));
    ck(label+': de la foto 2 gana la 1024x768', f2.length===1 && /1024x768/.test(f2[0]), JSON.stringify(f2));
    await p.close();
  }
  await b.close();
  const f=R.filter(x=>!x[0]).length;
  console.log('\n===== '+(R.length-f)+'/'+R.length+' PASS =====');
  process.exit(f?1:0);
})().catch(e=>{console.log('FATAL',e.message);process.exit(1);});
