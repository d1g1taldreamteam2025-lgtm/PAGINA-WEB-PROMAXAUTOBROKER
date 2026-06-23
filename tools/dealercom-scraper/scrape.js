#!/usr/bin/env node
/* =====================================================================
   Dealer.com  ->  Promax inventory.json  (scraper / parser)
   ---------------------------------------------------------------------
   Saca el inventario de un concesionario montado en Dealer.com (ej.
   toyotaofnorthmiami.com) y lo deja EN EL MISMO FORMATO que usa la web
   de Promax (assets/data/inventory.json), listo para enchufar al demo.

   De donde sale la data:
     Cada pagina de carro (VDP) trae un bloque
        <script type="application/ld+json"> { ...Car... } </script>
     con marca, modelo, anio, precio, millaje, VIN, colores, foto, etc.
     Este script lo lee y lo convierte al formato de Promax.

   DOS MODOS DE USO
   ----------------
   1) OFFLINE (recomendado, a prueba de balas — NO necesita instalar nada
      mas que Node):
        - Abre las paginas de los carros en TU navegador (ahi si entras).
        - Guardalas (Ctrl+S -> "Pagina web, solo HTML") dentro de la
          carpeta  ./input  (o pega el HTML en un archivo .html ahi).
        - Corre:   node scrape.js
        - Resultado:  ./inventory.json   (con todos los carros)

   2) LIVE (automatico, para pasar el antibot con Chrome de verdad —
      necesita Playwright:  npm i playwright  &&  npx playwright install chromium):
        - Por lista de URLs:
            node scrape.js --live --urls urls.txt
        - O dejando que el solo busque los carros en una pagina de listado:
            node scrape.js --live --srp "https://www.toyotaofnorthmiami.com/used-inventory/index.htm" --max 20
        - Si te bloquea igual, agrega  --headful  (abre Chrome visible).

   Opciones:  --out archivo.json   --input carpeta   --max N   --headful
   ===================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

/* ----------------------------- Mapeos -------------------------------- */
function mapFuel(s) {
  const f = String(s || '').toLowerCase();
  if (/hybrid|híbrid/.test(f)) return 'Híbrido';
  if (/electric|\bev\b|bev/.test(f)) return 'Eléctrico';
  if (/diesel|diésel/.test(f)) return 'Diésel';
  if (/gas|unleaded|regular|premium|gasolin/.test(f)) return 'Gasolina';
  return s || 'Gasolina';
}
function mapTransmission(s) {
  const x = String(s || '').toLowerCase();
  if (/auto|cvt|dct|a\/t/.test(x)) return 'Automática';
  if (/manual|m\/t/.test(x)) return 'Manual';
  return s || 'Automática';
}
function inferBody(model, name) {
  const m = (String(model || '') + ' ' + String(name || '')).toLowerCase();
  if (/tacoma|tundra|truck|pickup/.test(m)) return 'truck';
  if (/rav4|highlander|4runner|sequoia|venza|corolla cross|c-hr|chr|bz4x|land cruiser|grand highlander|suv/.test(m)) return 'suv';
  if (/gr86|gr 86|supra|coupe|cupé/.test(m)) return 'coupe';
  return 'sedan';
}
function conditionBadge(itemCondition, name) {
  const c = String(itemCondition || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (/certified/.test(c) || /certified/.test(n)) return 'Certificado';
  if (/used/.test(c) || /pre-owned|preowned|pre owned/.test(n)) return 'Usado';
  if (/new/.test(c) || /\bnew\b/.test(n)) return 'Nuevo';
  return '';
}
function escapeRegex(s) { return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function deriveTrim(name, year, make, model) {
  let t = String(name || '');
  ['Certified Pre-Owned', 'Pre-Owned', 'Pre Owned', 'Preowned', 'Certified', 'Used', 'New'].forEach(function (w) {
    t = t.replace(new RegExp(w, 'ig'), ' ');
  });
  if (year) t = t.replace(new RegExp(String(year), 'g'), ' ');
  if (make) t = t.replace(new RegExp(escapeRegex(make), 'ig'), ' ');
  if (model) t = t.replace(new RegExp(escapeRegex(model), 'ig'), ' ');
  return t.replace(/\s+/g, ' ').trim();
}
function firstImage(img) {
  if (!img) return '';
  if (Array.isArray(img)) return img[0] && (img[0].url || img[0]) || '';
  if (typeof img === 'object') return img.url || '';
  return img;
}

/* -------------- Extraer carros de un HTML (string) ------------------- */
function extractVehicles(html) {
  const out = [];
  const reLd = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = reLd.exec(html))) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch (e) { continue; }
    const list = Array.isArray(data) ? data : (Array.isArray(data['@graph']) ? data['@graph'] : [data]);
    list.forEach(function (ld) {
      const types = [].concat(ld && ld['@type'] || []).map(String);
      const isVehicle = types.some(function (t) { return /Car|Vehicle|Product/i.test(t); });
      if (!isVehicle) return;
      if (!ld.vehicleIdentificationNumber && !ld.model && !(ld.offers && ld.offers.price)) return;
      out.push(toRow(ld, html));
    });
  }
  return out;
}

function toRow(ld, html) {
  const offers = ld.offers || {};
  const year = Number(ld.vehicleModelDate || ld.productionDate ||
    ((String(ld.name || '').match(/\b(19|20)\d{2}\b/) || [])[0])) || null;
  const make = (ld.brand && (ld.brand.name || ld.brand)) || (ld.manufacturer && ld.manufacturer.name) || 'Toyota';
  const model = ld.model || '';
  const cover = firstImage(ld.image);

  // Galeria: todas las fotos de pictures.dealer.com de ESTE concesionario.
  let gallery = [];
  const acct = (String(cover).match(/pictures\.dealer\.com\/[a-z]\/([a-z0-9-]+)\//i) || [])[1];
  if (acct && html) {
    const reImg = new RegExp('https?:\\/\\/pictures\\.dealer\\.com\\/[a-z]\\/' + escapeRegex(acct) + '\\/[^"\'\\s)]+\\.(?:jpg|jpeg|png|webp)', 'gi');
    const seen = {};
    let g;
    while ((g = reImg.exec(html))) {
      if (/\/thumb_/.test(g[0])) continue;          // descarta miniaturas (duplicados en chiquito)
      if (!seen[g[0]]) { seen[g[0]] = 1; gallery.push(g[0]); }
    }
    gallery = gallery.slice(0, 30);
  }
  if (cover && gallery.indexOf(cover) === -1) gallery.unshift(cover);
  if (!gallery.length && cover) gallery = [cover];

  const mileage = ld.mileageFromOdometer && (ld.mileageFromOdometer.value != null
    ? ld.mileageFromOdometer.value : ld.mileageFromOdometer);

  return {
    stock: ld.sku || ld.mpn || '',
    vin: ld.vehicleIdentificationNumber || '',
    year: year,
    make: make,
    model: model,
    trim: deriveTrim(ld.name, year, make, model),
    body_type: inferBody(model, ld.name),
    price: Number(offers.price || offers.lowPrice || 0) || 0,
    msrp: null,
    mileage: Number(mileage) || 0,
    fuel: mapFuel(ld.fuelType),
    transmission: mapTransmission(ld.vehicleTransmission),
    drivetrain: ld.driveWheelConfiguration || 'FWD',
    exterior_color: ld.color || '',
    interior_color: ld.vehicleInteriorColor || '',
    badge: conditionBadge(ld.itemCondition, ld.name),
    featured: false,
    cover_image: cover,
    gallery: gallery,
    features: [],
    description: ld.description || '',
    source_url: ld.url || offers.url || ''
  };
}

/* --------------------------- Salida ---------------------------------- */
function dedupe(rows) {
  const seen = {}, out = [];
  rows.forEach(function (r) {
    const k = r.vin || r.stock || (r.year + r.make + r.model + r.price);
    if (k && seen[k]) return;
    seen[k] = 1; out.push(r);
  });
  return out;
}
function writeInventory(rows, outFile) {
  rows = dedupe(rows.filter(function (r) { return r && (r.vin || r.model); }));
  fs.writeFileSync(outFile, JSON.stringify(rows, null, 2));
  console.log('✅ ' + rows.length + ' carros -> ' + outFile);
  rows.slice(0, 8).forEach(function (r) {
    console.log('   • ' + r.year + ' ' + r.make + ' ' + r.model + ' ' + (r.trim || '') +
      '  $' + r.price.toLocaleString('en-US') + '  ' + (r.mileage || 0) + 'mi  ' + (r.vin || ''));
  });
  if (rows.length > 8) console.log('   … y ' + (rows.length - 8) + ' mas');
}

/* ------------------------- Modo OFFLINE ------------------------------ */
function runOffline(inputDir, outFile) {
  if (!fs.existsSync(inputDir)) { console.error('No existe la carpeta ' + inputDir); process.exit(1); }
  const files = fs.readdirSync(inputDir).filter(function (f) { return /\.html?$/i.test(f); });
  if (!files.length) {
    console.error('No hay archivos .html en ' + inputDir + '.\n' +
      'Guarda ahi las paginas de los carros (Ctrl+S -> "solo HTML") y vuelve a correr.');
    process.exit(1);
  }
  let all = [];
  files.forEach(function (f) {
    const html = fs.readFileSync(path.join(inputDir, f), 'utf8');
    const rows = extractVehicles(html);
    console.log('  ' + f + ': ' + rows.length + ' carro(s)');
    all = all.concat(rows);
  });
  writeInventory(all, outFile);
}

/* -------------------------- Modo LIVE -------------------------------- */
async function runLive(opts) {
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) {
    console.error('Falta Playwright. Instalalo con:\n  npm i playwright\n  npx playwright install chromium');
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: !opts.headful });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    viewport: { width: 1366, height: 900 }, locale: 'en-US'
  });
  const page = await ctx.newPage();
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  let urls = opts.urls || [];
  if (opts.srp) {
    console.log('Abriendo listado: ' + opts.srp);
    await page.goto(opts.srp, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2500);
    const links = await page.$$eval('a[href]', function (as) { return as.map(function (a) { return a.href; }); });
    urls = links.filter(function (h) { return /\/(used|new|certified)\//.test(h) && /\.htm/.test(h); });
    urls = Array.from(new Set(urls)).slice(0, opts.max || 20);
    console.log('  encontrados ' + urls.length + ' carros');
  }

  let all = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      await page.goto(urls[i], { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(1200 + Math.random() * 1500); // ritmo humano, amable con su servidor
      const html = await page.content();
      const rows = extractVehicles(html);
      console.log('  [' + (i + 1) + '/' + urls.length + '] ' + rows.length + ' ← ' + urls[i]);
      all = all.concat(rows);
    } catch (e) {
      console.log('  [' + (i + 1) + '/' + urls.length + '] ERROR ' + urls[i] + ' (' + e.message + ')');
    }
  }
  await browser.close();
  writeInventory(all, opts.out);
}

/* ----------------------------- CLI ----------------------------------- */
function parseArgs(argv) {
  const o = { live: false, headful: false, out: null, input: null, srp: null, urls: null, max: 20 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') o.live = true;
    else if (a === '--headful') o.headful = true;
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--input') o.input = argv[++i];
    else if (a === '--srp') o.srp = argv[++i];
    else if (a === '--max') o.max = parseInt(argv[++i], 10) || 20;
    else if (a === '--urls') {
      const f = argv[++i];
      o.urls = fs.readFileSync(f, 'utf8').split(/\r?\n/).map(function (s) { return s.trim(); })
        .filter(function (s) { return s && !s.startsWith('#'); });
    }
  }
  return o;
}

(function main() {
  const here = __dirname;
  const o = parseArgs(process.argv.slice(2));
  o.out = o.out || path.join(here, 'inventory.json');
  o.input = o.input || path.join(here, 'input');
  if (o.live) {
    runLive(o).catch(function (e) { console.error(e); process.exit(1); });
  } else {
    runOffline(o.input, o.out);
  }
})();
