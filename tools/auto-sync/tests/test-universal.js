let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs');
const SRC = fs.readFileSync(require('path').join(__dirname,'..','engine.js'),'utf8');
const R=[]; function ck(n,ok,i){R.push([ok]);console.log((ok?'PASS':'FAIL')+'  '+n+(i?'  ['+i+']':''));}

// ---------- FIXTURES (réplicas de cada plataforma segun los 5 reportes) ----------
function hgregCard(year,mk,md,tr,price,vin,miles,specs,img){
 return `<div itemscope itemtype="http://schema.org/Vehicle" class="vehicle-card">
   <a itemprop="url" href="/used-car/${mk}-${md}-${year}-for-sale-${vin.slice(-6)}"><img src="${img}"></a>
   <span itemprop="name">${year} ${mk} ${md} ${tr}</span>
   <div itemprop="offers" itemscope itemtype="http://schema.org/Offer"><meta itemprop="price" content="${price}"></div>
   <div class="miles">${miles} mi</div><div class="specs">${specs}</div>
   <span itemprop="vehicleIdentificationNumber">${vin}</span></div>`;
}
const FX = {
 hgreg: {host:'hgreg.com', html:`<main>`+
   hgregCard(2022,'Toyota','Corolla','LE',21998,'5YFEPMAE7NP123456','34,120','SEDAN · GASOLINE · AUTOMATIC · FWD','https://img.hgreg.com/a/1.jpg')+
   hgregCard(2023,'Honda','CR-V','EX',28995,'2HKRW2H85PH777888','12,300','SUV · GASOLINE · AUTOMATIC · AWD','https://img.hgreg.com/a/2.jpg')+
   hgregCard(2018,'Nissan','Sentra','SV',13990,'3N1AB7AP7JY111222','66,000','SEDAN · GASOLINE · AUTOMATIC · FWD','https://img.hgreg.com/a/3.jpg')+ // <2020 -> fuera
   hgregCard(2021,'Ford','Escape','SE',19995,'1FMCU9G61MUA33344','40,500','SUV · GASOLINE · AUTOMATIC · FWD','https://img.hgreg.com/a/4.jpg')+
   `</main>`, expect:{count:3, minYear:2020, cats:['cars','cars','cars']}},

 hgregtrucks: {host:'hgregtrucks.com', html:`<main>`+
   hgregCard(2023,'Freightliner','Cascadia','126',89000,'3AKJHHDR7PSNM1234','310,000','SLEEPER · DIESEL · AUTOMATIC','https://img.hgregtrucks.com/a/1.jpg')+
   hgregCard(2022,'Peterbilt','579','Day Cab',95000,'1XPBDP9X7ND456789','280,120','DAY CAB · DIESEL · MANUAL','https://img.hgregtrucks.com/a/2.jpg')+
   hgregCard(2021,'Kenworth','T680','Sleeper',72000,'1XKYDP9X6MJ998877','420,000','SLEEPER · DIESEL · AUTOMATIC','https://img.hgregtrucks.com/a/3.jpg')+ // <2022 -> fuera
   hgregCard(2024,'Volvo','VNL','760',120000,'4V4NC9EH2RN223344','90,000','SLEEPER · DIESEL · AUTOMATIC','https://img.hgregtrucks.com/a/4.jpg')+
   `</main>`, expect:{count:3, minYear:2022, cats:['trucks_machinery','trucks_machinery','trucks_machinery']}},

 international: {host:'internationalcarsusa.com', html:`<div class="inventory">`+
   [['2020','FORD F250 SUPER DUTY CREW CAB','55,900','1FT7W2BT8KEE15735','81,204','AUTOMATIC','DIESEL','4WD','PICKUP'],
    ['2025','FORD TRANSIT 350 PASSENGER VAN','55,000','1FBAX2C84SKA19773','55,032','AUTOMATIC','GASOLINE','RWD','PASSENGER VAN'],
    ['2024','CHEVROLET SUBURBAN','54,000','1GNSKCKD4RR234890','56,890','AUTOMATIC','GASOLINE','4WD','SUV'],
    ['2018','KIA OPTIMA LX','12,000','5XXGT4L30JG244551','98,000','AUTOMATIC','GASOLINE','FWD','SEDAN']]  // <2020 -> fuera
   .map(v=>`<div class="v"><img src="https://imagescdn.dealercarsearch.com/x/${v[3].slice(-6)}.jpg">
      <div class="ttl">${v[0]} ${v[1]}</div><div class="pr">Vehicle Price: $${v[2]}</div>
      <div>${v[3]}</div><div>${v[4]}</div><div>${v[5]}</div><div>${v[6]}</div><div>${v[7]}</div><div>${v[8]}</div><div>MIAMI</div></div>`).join('')+
   `</div>`, expect:{count:3, minYear:2020, cats:['cars','vans','cars'],
     checks:(rows,ck,key)=>{ var f=rows[0];
       ck(key+': F250 -> carroceria Truck', f.body_type==='Truck', f.body_type);
       ck(key+': F250 -> combustible Diesel', f.fuel==='Diesel', f.fuel);
       ck(key+': F250 -> traccion 4WD', f.drivetrain==='4WD', f.drivetrain);
       ck(key+': F250 -> transmision Automatica', f.transmission==='Automatica', f.transmission);
     }}},

 autodeal: {host:'autodealmiami.net', html:`<div class="grid">`+
   [['1HGCV1F30LA123456','2020 Honda Accord Sport','23,500','Sedan · Gasoline · Automatic · FWD · 41,000 mi'],
    ['3KPF24AD7LE111222','2020 Kia Forte LXS','16,900','Sedan · Gasoline · Automatica · FWD · 33,000 mi'],
    ['1C4RJFAG9KC555666','2019 Jeep Grand Cherokee','21,000','SUV · Gasoline · 4WD · 70,000 mi'], // <2020 -> fuera
    ['5NPD84LF7LH222333','2021 Hyundai Elantra SEL','18,750','Sedan · Gasoline · Automatic · FWD · 22,000 mi']]
   .map(v=>`<div data-vin="${v[0]}" class="card"><img src="https://imagescdn.dealercarsearch.com/y/${v[0].slice(-6)}.jpg">
      <h3>${v[1]}</h3><div class="price">$${v[2]}</div><div class="specs">${v[3]}</div></div>`).join('')+
   `</div>`, expect:{count:3, minYear:2020, cats:['cars','cars','cars']}},

 motoport: {host:'motoportusa.com', html:`<div class="listing">`+
   [['2023 Sea-Doo GTX 170','14,999','Personal Watercraft','watercraft'],
    ['2022 Yamaha YZF-R7','9,299','Motorcycle Sport','motorcycles'],
    ['2024 Polaris RZR XP 1000','25,999','UTV Side-by-Side','utv'],
    ['2019 Kawasaki Ninja 400','4,500','Motorcycle','filtered']] // <2020 -> fuera
   .map((v,i)=>`<article class="unit"><img src="https://img.dealerspike.com/${i}.jpg"><h2>${v[0]}</h2>
      <div class="price">$${v[1]}</div><div class="type">${v[2]}</div></article>`).join('')+
   `</div>`, expect:{count:3, minYear:2020, cats:['watercraft','motorcycles','utv']}},
};

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const ctx=await b.newContext();
  const page=await ctx.newPage();
  for(const key of Object.keys(FX)){
    const fx=FX[key];
    await page.setContent('<!doctype html><html><body>'+fx.html+'</body></html>',{waitUntil:'domcontentloaded'});
    await page.addScriptTag({content: SRC});
    const rows = await page.evaluate((opts)=>window.promaxExtract(opts), {host:fx.host, source:fx.host});
    console.log('\n----- '+key+' ('+fx.host+') -> '+rows.length+' vehiculos -----');
    rows.forEach(r=>console.log('   '+r.year+' '+r.make+' '+r.model+' '+(r.trim||'')+' | $'+r.price+' | '+r.mileage+'mi | '+r.category+' | '+r.body_type+' | '+r.fuel+'/'+r.drivetrain+' | vin='+(r.vin||'-')+' | fotos='+r.gallery.length));
    // aserciones
    ck(key+': cuenta correcta (filtro año '+fx.expect.minYear+'+)', rows.length===fx.expect.count, rows.length+'/'+fx.expect.count);
    ck(key+': ninguno por debajo del año minimo', rows.every(r=>!r.year||r.year>=fx.expect.minYear), rows.map(r=>r.year).join(','));
    ck(key+': todos con precio>0', rows.every(r=>r.price>0), rows.map(r=>r.price).join(','));
    ck(key+': todos con marca y modelo', rows.every(r=>r.make&&r.model), '');
    ck(key+': todos con al menos 1 foto', rows.every(r=>r.gallery.length>=1), rows.map(r=>r.gallery.length).join(','));
    ck(key+': categorias esperadas', JSON.stringify(rows.map(r=>r.category))===JSON.stringify(fx.expect.cats), rows.map(r=>r.category).join(',')+' vs '+fx.expect.cats.join(','));
    ck(key+': id estable (VIN si existe, si no slug)', rows.every(r=>r.id && (r.vin ? r.id===r.vin : /\d{4}-/.test(r.id))), rows.map(r=>r.id).join(' , '));
    ck(key+': source marcado', rows.every(r=>r.source===fx.host), '');
    if(fx.expect.checks) fx.expect.checks(rows, ck, key);
  }
  // dedup: repetir un VIN no lo duplica
  await page.setContent('<!doctype html><html><body><div>'+hgregCard(2022,'Toyota','Corolla','LE',21998,'5YFEPMAE7NP123456','34,120','SEDAN · GAS · AUTOMATIC · FWD','https://x/1.jpg')+hgregCard(2022,'Toyota','Corolla','LE',21998,'5YFEPMAE7NP123456','34,120','SEDAN · GAS · AUTOMATIC · FWD','https://x/1.jpg')+hgregCard(2023,'Honda','Civic','EX',24000,'2HGFE2F50PH909090','5,000','SEDAN · GAS · AUTOMATIC · FWD','https://x/2.jpg')+'</div></body></html>');
  await page.addScriptTag({content: SRC});
  const dd = await page.evaluate(()=>window.promaxExtract({host:'hgreg.com'}));
  ck('dedup: VIN repetido no se duplica', dd.length===2, dd.length+' (esperado 2)');

  await b.close();
  const fails=R.filter(x=>!x[0]).length;
  console.log('\n===== '+(R.length-fails)+'/'+R.length+' PASS =====');
  process.exit(fails?1:0);
})().catch(e=>{console.log('FATAL',e.message,e.stack);process.exit(1);});
