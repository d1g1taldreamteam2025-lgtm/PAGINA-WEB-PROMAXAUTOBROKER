/* =====================================================================
   PROMAX AUTO BROKER — Backend de REFERIDOS (Google Apps Script)
   ---------------------------------------------------------------------
   Conecta el formulario interno de /referrals/ con una hoja de Google.
   Cuenta las ventas y permite hacer el sorteo al llegar a la meta.

   CÓMO INSTALARLO (5 minutos):
   1. Crea una hoja en Google Sheets (https://sheets.new).
   2. Menú  Extensiones → Apps Script.
   3. Borra el contenido y pega ESTE archivo completo.
   4. Cambia TOKEN abajo por una clave secreta (la MISMA que pongas en
      config.js -> endpoints.referralsToken).
   5. Implementar → Nueva implementación → tipo "Aplicación web".
        - Ejecutar como: Yo
        - Quién tiene acceso: Cualquier usuario
   6. Copia la URL del Web App y pégala en config.js -> referralsScriptUrl.
   ===================================================================== */

var SHEET_NAME  = 'Referidos';
var TOKEN       = 'promax-2026';   // <-- CAMBIA esto (igual que en config.js)
var GOAL        = 100;             // ventas para activar el sorteo
var SOLD_STATUS = 'Vendido';       // estado que cuenta como venta
var HEADERS = ['Fecha','Referidor','Tel Referidor','Cliente Referido','Tel Cliente','Vehículo','Estado','Notas','Registrado por'];

function doGet(e)  { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  var p = (e && e.parameter) || {};
  var cb = p.callback;
  var out;
  try {
    if (p.token !== TOKEN) {
      out = { ok: false, error: 'unauthorized' };
    } else {
      switch (p.action || 'count') {
        case 'add':    out = addRow(p); break;
        case 'count':  out = counts(); break;
        case 'list':   out = listRows(Number(p.limit) || 10); break;
        case 'raffle': out = raffle(); break;
        default:       out = { ok: false, error: 'unknown action' };
      }
    }
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return respond(out, cb);
}

function respond(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function addRow(p) {
  var sh = getSheet();
  sh.appendRow([
    new Date(),
    p.referrer || '', p.referrer_phone || '',
    p.referred || '', p.referred_phone || '',
    p.vehicle || '', p.status || 'Referido',
    p.notes || '', p.added_by || ''
  ]);
  var c = counts();
  c.added = true;
  return c;
}

function counts() {
  var sh = getSheet();
  var total = Math.max(0, sh.getLastRow() - 1);
  var sold = 0;
  if (total > 0) {
    var estados = sh.getRange(2, 7, total, 1).getValues();
    sold = estados.filter(function (r) {
      return String(r[0]).trim().toLowerCase() === SOLD_STATUS.toLowerCase();
    }).length;
  }
  return { ok: true, total: total, sold: sold, goal: GOAL, raffleReady: sold >= GOAL };
}

function listRows(limit) {
  var sh = getSheet();
  var total = Math.max(0, sh.getLastRow() - 1);
  if (total === 0) return { ok: true, rows: [] };
  var n = Math.min(limit, total);
  var data = sh.getRange(sh.getLastRow() - n + 1, 1, n, HEADERS.length).getValues().reverse();
  var rows = data.map(function (r) {
    return { fecha: r[0], referrer: r[1], referred: r[3], vehicle: r[5], status: r[6], by: r[8] };
  });
  return { ok: true, rows: rows };
}

function raffle() {
  var sh = getSheet();
  var total = Math.max(0, sh.getLastRow() - 1);
  if (total === 0) return { ok: false, error: 'no entries' };
  var data = sh.getRange(2, 1, total, HEADERS.length).getValues();
  var eligible = data.filter(function (r) {
    return String(r[6]).trim().toLowerCase() === SOLD_STATUS.toLowerCase();
  });
  if (!eligible.length) return { ok: false, error: 'no sold entries' };
  var w = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    ok: true,
    winner: { referrer: w[1], referrer_phone: w[2], referred: w[3], vehicle: w[5] },
    pool: eligible.length
  };
}
