/* =========================================================================
   PROMAX AUTO BROKER — BACKEND GOOGLE SHEETS (Google Apps Script)
   -------------------------------------------------------------------------
   QUÉ HACE:
   - Recibe los formularios del sitio (referidos, financiamiento, contacto).
   - Guarda cada uno en su pestaña: "Referidos" y "Leads".
   - Devuelve el conteo de ventas (referidos marcados "vendido") para la
     barra de progreso del sorteo (X / META).

   CÓMO INSTALARLO (una sola vez):
   1. Crea una Google Sheet nueva (en la cuenta de Google de ProMax).
   2. Menú: Extensiones > Apps Script. Borra lo que haya y pega TODO esto.
   3. Guarda. Botón "Implementar" > "Nueva implementación".
   4. Tipo: "Aplicación web". Ejecutar como: "Yo".
      Quién tiene acceso: "Cualquier persona".  <-- IMPORTANTE
   5. Implementar > autoriza con tu cuenta de Google.
   6. Copia la "URL de la aplicación web" (termina en /exec).
   7. Pégala en /assets/js/config.js  ->  appsScriptUrl: "....../exec"

   Para marcar una venta: en la pestaña "Referidos", escribe "vendido" en la
   columna "Estatus". La barra de progreso del sitio se actualiza sola.
   ========================================================================= */

var META_GOAL = 100;          // ventas para el sorteo (debe coincidir con config.js)
var SHEET_REFERRALS = 'Referidos';
var SHEET_LEADS = 'Leads';

function doPost(e){
  try{
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var type = data.form_type || 'lead';
    if (type === 'referral') saveReferral_(data);
    else saveLead_(data);
    return json_({ ok:true, sales: countSales_(), goal: META_GOAL });
  }catch(err){
    return json_({ ok:false, error: String(err) });
  }
}

function doGet(e){
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'status'){
    return json_({ ok:true, referrals: countReferrals_(), sales: countSales_(), goal: META_GOAL });
  }
  return json_({ ok:true, service:'ProMax Auto Broker backend', sales: countSales_(), goal: META_GOAL });
}

/* --------------------------- Guardado --------------------------- */
function saveReferral_(d){
  var sh = getSheet_(SHEET_REFERRALS, [
    'Fecha','Cliente referido','Teléfono','Vehículo de interés','Referido por','Estatus','Notas','Idioma','Origen'
  ]);
  var r = d.raw_fields || {};
  sh.appendRow([
    new Date(),
    r.ref_name || d.name || '',
    r.ref_phone || d.phone || '',
    r.ref_vehicle || '',
    r.referred_by || '',
    r.status || 'Pendiente',
    r.notes || '',
    d._lang || '',
    d._source_url || ''
  ]);
}

function saveLead_(d){
  var sh = getSheet_(SHEET_LEADS, [
    'Fecha','Tipo','Nombre','Email','Teléfono','Mensaje','Datos completos','Idioma','Origen'
  ]);
  sh.appendRow([
    new Date(),
    d.form_type || 'lead',
    d.name || '',
    d.email || '',
    d.phone || '',
    d.message || '',
    JSON.stringify(d.raw_fields || {}),
    d._lang || '',
    d._source_url || ''
  ]);
}

/* --------------------------- Conteos --------------------------- */
function countReferrals_(){
  var sh = getSheet_(SHEET_REFERRALS, null);
  if (!sh) return 0;
  return Math.max(0, sh.getLastRow() - 1); // menos encabezado
}

function countSales_(){
  var sh = getSheet_(SHEET_REFERRALS, null);
  if (!sh || sh.getLastRow() < 2) return 0;
  // Columna 6 = "Estatus"
  var values = sh.getRange(2, 6, sh.getLastRow() - 1, 1).getValues();
  var count = 0;
  for (var i = 0; i < values.length; i++){
    var v = String(values[i][0] || '').trim().toLowerCase();
    if (v === 'vendido' || v === 'sold') count++;
  }
  return count;
}

/* --------------------------- Utilidades --------------------------- */
function getSheet_(name, headers){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh && headers){
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
