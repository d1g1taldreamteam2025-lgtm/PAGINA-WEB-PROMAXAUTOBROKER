// Regenera el motor embebido de los bookmarklets del admin desde
// tools/auto-sync/engine.js (fuente de la verdad), conservando el "driver"
// (UI de copiar/subir) que ya tenía cada bookmarklet.
const fs = require('fs');
const path = require('path');
const REPO = path.join(__dirname, '..', '..');
const { strip, scanFns, topFns } = require('./build-bookmarklets-lib.js');
const eng = fs.readFileSync(REPO + '/tools/auto-sync/engine.js', 'utf8');

/* ---- 1) minificar: quitar comentarios y colapsar saltos (tokenizer) ---- */
const MIN = strip(eng);
// validar que sigue siendo JS correcto
fs.writeFileSync(path.join(__dirname, 'engine.min.js'), MIN);
require('child_process').execSync(JSON.stringify(process.execPath) + ' --check ' + JSON.stringify(path.join(__dirname, 'engine.min.js')));
console.log('engine.min.js valida OK,', MIN.length, 'chars');
if (MIN.includes('`') || MIN.includes('${')) throw new Error('engine contiene backtick/interpolacion: rompe String.raw');

/* ---- 2) separar funciones top-level (tokenizer con regex-awareness) ---- */
const F = topFns(MIN);
const need = ['promaxExtract','promaxDetailMedia','promaxRunAll','promaxCanonMake','promaxToDb','promaxUpload','promaxSync'];
need.forEach(f => { if (!F[f]) throw new Error('falta funcion ' + f); });
console.log('funciones extraidas:', Object.keys(F).join(', '));

/* ---- 3) extraer el DRIVER viejo de cada bookmarklet (tras el motor) ---- */
const adminPath = REPO + '/admin/index.html';
let admin = fs.readFileSync(adminPath, 'utf8');
function rebuild(varName, fnList) {
  const reLine = new RegExp('const ' + varName + ' = String\\.raw`([\\s\\S]*?)`;');
  const m = reLine.exec(admin);
  if (!m) throw new Error(varName + ' no encontrado');
  const old = m[1];
  const pre = 'javascript:(function(){';
  if (!old.startsWith(pre)) throw new Error(varName + ': prefijo inesperado');
  // localizar fin del bloque de funciones promax* del motor viejo
  const inner = old.slice(pre.length);
  const spans = scanFns(inner).filter(sp => /^promax/.test(sp.name));
  if (!spans.length) throw new Error(varName + ': no hallo funciones promax');
  let cursor = pre.length + spans[spans.length - 1].end;
  while (old[cursor] === ' ' || old[cursor] === ';') cursor++;
  const fnCount = spans.length;
  const driver = old.slice(cursor);
  console.log(varName + ': motor viejo = ' + fnCount + ' funciones, driver = ' + driver.length + ' chars, empieza con: ' + driver.slice(0, 60));
  const engineNew = fnList.map(f => F[f]).join(' ');
  const rebuilt = pre + engineNew + ' ' + driver;
  admin = admin.replace(m[0], function () { return 'const ' + varName + ' = String.raw`' + rebuilt + '`;'; });
  return rebuilt;
}
rebuild('BOOKMARKLET_UNIV_HREF', ['promaxExtract','promaxDetailMedia','promaxRunAll']);
rebuild('BOOKMARKLET_SYNC_HREF', need);
fs.writeFileSync(adminPath, admin);
console.log('admin/index.html actualizado');
