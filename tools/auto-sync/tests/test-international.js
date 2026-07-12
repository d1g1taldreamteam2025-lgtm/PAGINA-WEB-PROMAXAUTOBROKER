// Fixture estilo INTERNATIONAL CARS USA (eBizAutos): las tarjetas NO tienen
// data-vin / itemtype / article — solo texto con VIN de 17 y precio. El motor
// debe encontrarlas con el rescate por VIN (pool scan). Prueba el motor REAL
// (engine.js) y el MINIFICADO embebido en los bookmarklets.
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs');
const R=[]; function ck(n,ok,i){R.push([ok]);console.log((ok?'PASS':'FAIL')+'  '+n+(!ok&&i?'  ['+i+']':''));}
function intlCard(year,mk,md,vin,miles,price,img){
 return `<div class="listItemContainer"><div class="listItemLeft"><a href="/inventory/${mk.toLowerCase()}/${md.toLowerCase().replace(/ /g,'-')}/key${vin.slice(-4)}/"><img src="${img}"></a></div>
 <div class="listItemRight"><h3><span class="listYear">${year}</span> ${mk.toUpperCase()} ${md.toUpperCase()}</h3>
 <div>Vehicle Price: <span class="price">$${price}</span></div>
 <div>VIN ${vin} · ${miles} · AUTOMATIC · DIESEL · 4WD · PICKUP</div>
 <a href="/inventory/${mk.toLowerCase()}/${md.toLowerCase().replace(/ /g,'-')}/key${vin.slice(-4)}/">VIEW DETAILS</a></div></div>`;
}
const HTML = `<html><body><div id="results">`+
 intlCard(2022,'Ford','F250 Super Duty Crew Cab','1FT7W2BT8KEE15735','81,204 mi','55,900','https://cdn.ebz.com/1.jpg')+
 intlCard(2023,'Chevrolet','Silverado 2500 HD Crew','1GC1YREY8PF115128','91,450 mi','55,900','https://cdn.ebz.com/2.jpg')+
 intlCard(2025,'Ford','Transit 350','1FBAX2Y80PKB51234','12,001 mi','55,999','https://cdn.ebz.com/3.jpg')+
 intlCard(2018,'Ram','1500 Laramie','1C6RR7VT3JS111222','99,000 mi','25,900','https://cdn.ebz.com/4.jpg')+ // <2020 -> fuera
 `</div></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PROMAX_CHROMIUM || undefined, args: ['--no-sandbox'] });
  const P=require('path'); const engPath=P.join(__dirname,'..','engine.js');
  const { strip }=require(P.join(__dirname,'..','build-bookmarklets-lib.js'));
  const minSrc=strip(fs.readFileSync(engPath,'utf8'));
  for (const [label, SRCTXT] of [['engine.js', fs.readFileSync(engPath,'utf8')],['engine.min (bookmarklet)', minSrc]]) {
    const SRC = SRCTXT;
    const p = await b.newPage();
    await p.setContent(HTML.replace('<html>','<html><base href="https://www.internationalcarsusa.com/inventory/">'));
    await p.evaluate('(function(){' + SRC + ';window.__X=promaxExtract;})()');
    const rows = await p.evaluate(() => window.__X({ host:'internationalcarsusa.com', baseUrl:'https://www.internationalcarsusa.com/inventory/', source:'internationalcarsusa.com', minYear:2020 }));
    ck(label+': detecta 3 vehículos por VIN (sin selectores conocidos)', rows.length===3, 'n='+rows.length+' '+JSON.stringify(rows.map(r=>r.model||'').slice(0,4)));
    const f250 = rows.filter(r=>/F250|F-250|SUPER DUTY/i.test((r.model||'')+' '+(r.trim||'')))[0];
    ck(label+': F250 con VIN correcto', !!f250 && f250.vin==='1FT7W2BT8KEE15735', f250 && f250.vin);
    ck(label+': precio del F250 = 55900', !!f250 && Number(f250.price)===55900, f250 && f250.price);
    ck(label+': el 2018 (viejo) queda fuera', rows.every(r=>Number(r.year)>=2020), JSON.stringify(rows.map(r=>r.year)));
    ck(label+': link de ficha absoluto', rows.every(r=>/^https:\/\/www\.internationalcarsusa\.com\//.test(r.source_url||'')), rows[0]&&rows[0].source_url);
    await p.close();
  }
  await b.close();
  const f=R.filter(x=>!x[0]).length;
  console.log('\n===== ' + (R.length-f) + '/' + R.length + ' PASS =====');
  process.exit(f?1:0);
})().catch(e=>{console.log('FATAL',e.message);process.exit(1);});
