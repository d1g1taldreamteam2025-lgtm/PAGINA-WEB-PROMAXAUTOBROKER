/* =====================================================================
   PROMAX — Sincronizador AUTOMÁTICO de inventario (robot semanal)
   Corre en GitHub Actions (lunes 6am). Para cada dealer:
     1) abre su LISTA de inventario en un Chromium real (pasa antibots),
     2) inyecta el mismo motor probado (engine.js) y recorre TODAS las
        páginas + entra a cada ficha por sus 5 fotos (filtro de año +
        categoría),
     3) sube todo a Supabase con la SERVICE key (upsert por VIN) y marca
        como vendidos los que ya no aparecen.
   No requiere que nadie haga clic en nada.

   Variables de entorno (secrets de GitHub):
     SUPABASE_URL           ej. https://db.ucallnow.fun
     SUPABASE_SERVICE_KEY   service_role key (permiso de escritura)
   Overrides opcionales (para pruebas):
     PROMAX_DEALERS_FILE, PROMAX_TABLE, PROMAX_HEADFUL, PROMAX_CONCURRENCY
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ENGINE = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
const DEALERS_FILE = process.env.PROMAX_DEALERS_FILE || path.join(__dirname, 'dealers.json');
const DEALERS = JSON.parse(fs.readFileSync(DEALERS_FILE, 'utf8'));

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TABLE_NAME = process.env.PROMAX_TABLE || 'promax_inventory';
const TABLE = SUPABASE_URL + '/rest/v1/' + TABLE_NAME;
const CONC = parseInt(process.env.PROMAX_CONCURRENCY || '4', 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function log(m) { console.log('[' + new Date().toISOString() + '] ' + m); }

async function supa(method, urlSuffix, body, extraPrefer) {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
    Prefer: extraPrefer || 'return=minimal',
  };
  const res = await fetch(TABLE + urlSuffix, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(method + ' ' + res.status + ': ' + t.slice(0, 240));
  }
  return res;
}

async function upsert(rows) {
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await supa('POST', '?on_conflict=id', chunk, 'resolution=merge-duplicates,return=minimal');
    log('  · subidos ' + Math.min(i + 100, rows.length) + '/' + rows.length);
  }
}

async function markSold(source, stamp) {
  // Los de esta fuente que ya no se vieron en esta corrida -> vendidos
  await supa('PATCH',
    '?source=eq.' + encodeURIComponent(source) + '&status=eq.available&last_sync=lt.' + encodeURIComponent(stamp),
    { status: 'sold' });
}

async function scrapeDealer(browser, d, stamp) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 }, locale: 'en-US' });
  const page = await ctx.newPage();
  let rows = [];
  try {
    await page.goto(d.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.addScriptTag({ content: ENGINE });
    // El motor corre DENTRO del navegador (mismo origen que el dealer => pasa
    // antibot y puede fetchear las fichas). Devuelve filas ya en formato DB.
    rows = await page.evaluate(async (opts) => {
      const list = await window.promaxRunAll(opts, function () {});
      return list.map(function (r) { return window.promaxToDb(r, opts.source, opts.stamp); });
    }, {
      pages: 'all', details: true, concurrency: CONC,
      host: d.source, source: d.source, stamp,
      isTrucks: !!d.isTrucks, isPower: !!d.isPower, minYear: d.minYear,
    });
  } catch (e) {
    log('  ✗ ' + d.name + ' ERROR de scraping: ' + e.message);
  } finally {
    await ctx.close();
  }
  return rows;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('FALTAN secrets: SUPABASE_URL y/o SUPABASE_SERVICE_KEY.');
    process.exit(1);
  }
  const stamp = new Date().toISOString();
  log('Sincronización semanal — sello ' + stamp);
  const launchOpts = { args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'], headless: process.env.PROMAX_HEADFUL ? false : true };
  if (process.env.PROMAX_CHROMIUM) launchOpts.executablePath = process.env.PROMAX_CHROMIUM; // solo para pruebas locales
  const browser = await chromium.launch(launchOpts);
  const summary = [];
  let grand = 0;
  for (const d of DEALERS) {
    log('▶ ' + d.name + ' (' + d.url + ')');
    const rows = await scrapeDealer(browser, d, stamp);
    log('  ' + d.name + ': ' + rows.length + ' vehículos extraídos');
    if (rows.length) {
      try {
        await upsert(rows);
        await markSold(d.source, stamp);
        grand += rows.length;
        summary.push(d.name + ': ' + rows.length + ' ✓');
      } catch (e) {
        log('  ✗ ' + d.name + ' ERROR al subir: ' + e.message);
        summary.push(d.name + ': ' + rows.length + ' extraídos pero FALLÓ subir (' + e.message.slice(0, 60) + ')');
      }
    } else {
      summary.push(d.name + ': 0 (posible bloqueo antibot o estructura nueva)');
    }
  }
  await browser.close();
  log('===== RESUMEN =====');
  summary.forEach((s) => log('  ' + s));
  log('TOTAL sincronizado: ' + grand + ' vehículos');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
