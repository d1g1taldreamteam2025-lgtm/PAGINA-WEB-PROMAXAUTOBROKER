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
const ADMIN_EMAIL = process.env.PROMAX_ADMIN_EMAIL || '';
const ADMIN_PASS = process.env.PROMAX_ADMIN_PASSWORD || '';
const TABLE_NAME = process.env.PROMAX_TABLE || 'promax_inventory';
const TABLE = SUPABASE_URL + '/rest/v1/' + TABLE_NAME;
const CONC = parseInt(process.env.PROMAX_CONCURRENCY || '4', 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function log(m) { console.log('[' + new Date().toISOString() + '] ' + m); }

// La anon key es PÚBLICA (va en el navegador). La leemos del propio repo para
// no tener que configurarla como secret cuando se usa el login de admin.
function readAnonKey() {
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  try {
    const cfg = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'js', 'config.js'), 'utf8');
    const m = cfg.match(/anonKey:\s*["']([^"']+)["']/);
    if (m) return m[1];
  } catch (e) {}
  return '';
}

// Dos formas de tener permiso de escritura:
//   1) SUPABASE_SERVICE_KEY (service_role) — pasa RLS directo.
//   2) PROMAX_ADMIN_EMAIL + PROMAX_ADMIN_PASSWORD — inicia sesión como el
//      usuario del panel (rol authenticated), igual que /admin/. Más fácil
//      porque son las credenciales que ya usas para entrar.
let AUTH = null;
async function resolveAuth() {
  if (SERVICE_KEY) { AUTH = { apikey: SERVICE_KEY, bearer: SERVICE_KEY }; log('Auth: service_role key.'); return; }
  if (ADMIN_EMAIL && ADMIN_PASS) {
    const anon = readAnonKey();
    if (!anon) throw new Error('No encontré la anon key. Define SUPABASE_ANON_KEY.');
    const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
    });
    if (!res.ok) throw new Error('Login de admin falló (' + res.status + '): ' + (await res.text()).slice(0, 160));
    const j = await res.json();
    if (!j.access_token) throw new Error('Login de admin sin access_token.');
    AUTH = { apikey: anon, bearer: j.access_token }; log('Auth: sesión de admin (' + ADMIN_EMAIL + ').'); return;
  }
  throw new Error('FALTAN credenciales. Define SUPABASE_SERVICE_KEY, o PROMAX_ADMIN_EMAIL + PROMAX_ADMIN_PASSWORD.');
}

async function supa(method, urlSuffix, body, extraPrefer) {
  const headers = {
    apikey: AUTH.apikey,
    Authorization: 'Bearer ' + AUTH.bearer,
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

// Da tiempo a que los antibots que redirigen (Imperva/Cloudflare) resuelvan su
// challenge y aterricen en la página real ANTES de inyectar el motor.
async function settle(page, ms) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('domcontentloaded').catch(function () {});
}

// Algunos inventarios (DealerCenter/Carsforsale) montan las tarjetas por JS
// DESPUÉS de cargar la página. Esperamos a que aparezcan señales de tarjeta
// (hasta ~12s) con un empujón de scroll para disparar el lazy-load. Además
// dejamos un diagnóstico en el log: si un dealer sale 0, ahí se ve qué recibió
// el servidor (p.ej. una página de bloqueo antibot con el body casi vacío, o
// contenido real que el selector no reconoció).
async function waitForInventory(page, d) {
  async function signals() {
    return await page.evaluate(function () {
      return document.querySelectorAll('[data-vin]').length +
        document.querySelectorAll('[class*="vehicle"],[class*="listing"],[class*="inventory"]').length;
    }).catch(function () { return 0; });
  }
  let n = await signals();
  for (let i = 0; i < 6 && n === 0; i++) {
    await page.evaluate(function () { window.scrollTo(0, document.body.scrollHeight); }).catch(function () {});
    await page.waitForTimeout(2000);
    n = await signals();
  }
  const diag = await page.evaluate(function () {
    return {
      t: (document.title || '').slice(0, 70),
      b: ((document.body && document.body.innerText) || '').length,
      v: document.querySelectorAll('[data-vin]').length,
    };
  }).catch(function () { return { t: '?', b: 0, v: 0 }; });
  log('  · ' + d.name + ' [diag] señales=' + n + ' vin=' + diag.v + ' body=' + diag.b + ' title="' + diag.t + '"');
}

// Inyectamos el motor con page.evaluate (canal DevTools/CDP), NO con
// addScriptTag: muchos dealers tienen CSP que bloquea <script> inline
// ("Refused to execute inline script…") y evaluate NO pasa por CSP. Las
// funciones quedan en el window de la página. El motor corre DENTRO del
// navegador (mismo origen que el dealer => pasa antibot y fetchea las fichas).
async function injectAndExtract(page, d, stamp) {
  await page.evaluate('(function(){' + ENGINE + ';window.__PMX_RUN=promaxRunAll;window.__PMX_TODB=promaxToDb;})()');
  return await page.evaluate(async (opts) => {
    const list = await window.__PMX_RUN(opts, function () {});
    return list.map(function (r) { return window.__PMX_TODB(r, opts.source, opts.stamp); });
  }, {
    pages: 'all', details: true, concurrency: CONC,
    host: d.source, source: d.source, stamp,
    isTrucks: !!d.isTrucks, isPower: !!d.isPower, minYear: d.minYear,
  });
}

// "Execution context was destroyed / navigation" = la página se redirigió justo
// al inyectar (típico de Imperva). No es un fallo real: reintentamos una vez
// tras dejar que la redirección termine.
function isNavRace(msg) { return /context was destroyed|execution context|because of a navigation/i.test(msg || ''); }

async function scrapeDealer(browser, d, stamp) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 }, locale: 'en-US' });
  const page = await ctx.newPage();
  let rows = [];
  try {
    await page.goto(d.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await settle(page, 4000);
    await waitForInventory(page, d);
    try {
      rows = await injectAndExtract(page, d, stamp);
    } catch (e) {
      if (!isNavRace(e.message)) throw e;
      log('  · ' + d.name + ': la página se redirigió (antibot); reintento tras asentar…');
      await settle(page, 5000);
      rows = await injectAndExtract(page, d, stamp);
    }
  } catch (e) {
    log('  ✗ ' + d.name + ' ERROR de scraping: ' + e.message);
  } finally {
    await ctx.close();
  }
  return rows;
}

async function main() {
  if (!SUPABASE_URL) {
    console.error('FALTA el secret SUPABASE_URL (ej. https://db.ucallnow.fun).');
    process.exit(1);
  }
  await resolveAuth(); // valida credenciales antes de arrancar
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
