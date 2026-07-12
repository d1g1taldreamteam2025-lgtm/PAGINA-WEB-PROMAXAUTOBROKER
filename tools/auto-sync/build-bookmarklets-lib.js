// Utilidades compartidas del generador de bookmarklets:
// strip() quita comentarios y colapsa saltos (respeta strings y regex);
// scanFns()/topFns() ubican funciones top-level con conteo de llaves.
'use strict';
function strip(src) {
  let out = '', i = 0, n = src.length;
  let mode = 'code'; // code | s1 | s2 | tpl | re | line | block
  let prev = '';     // último char significativo emitido (para heurística de regex)
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && d === '/') { mode = 'line'; i += 2; continue; }
      if (c === '/' && d === '*') { mode = 'block'; i += 2; continue; }
      if (c === "'") { mode = 's1'; out += c; i++; continue; }
      if (c === '"') { mode = 's2'; out += c; i++; continue; }
      if (c === '`') { mode = 'tpl'; out += c; i++; continue; }
      if (c === '/') {
        // ¿regex o división? regex si lo anterior es un operador/apertura/keyword
        if (/[=(,:\[!&|?{};+\-*%<>~^]/.test(prev) || prev === '' || /\b(return|typeof|in|of|new|do|else|case)$/.test(out.slice(-8))) {
          mode = 're'; out += c; i++; continue;
        }
        out += c; prev = c; i++; continue;
      }
      out += c;
      if (!/\s/.test(c)) prev = c;
      i++; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += '\n'; } i++; continue; }
    if (mode === 'block') { if (c === '*' && d === '/') { mode = 'code'; i += 2; } else i++; continue; }
    if (mode === 's1') { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === "'") { mode = 'code'; prev = c; } i++; continue; }
    if (mode === 's2') { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === '"') { mode = 'code'; prev = c; } i++; continue; }
    if (mode === 'tpl') { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === '`') { mode = 'code'; prev = c; } i++; continue; }
    if (mode === 're') {
      out += c;
      if (c === '\\') { out += d; i += 2; continue; }
      if (c === '[') { // clase de caracteres: '/' dentro no cierra
        i++; while (i < n) { out += src[i]; if (src[i] === '\\') { i++; out += src[i]; } else if (src[i] === ']') break; i++; } i++; continue;
      }
      if (c === '/') { mode = 'code'; prev = c; }
      i++; continue;
    }
  }
  // colapsar espacios/saltos (los strings ya no tienen saltos: engine no usa multilinea)
  return out.replace(/\s*\n\s*/g, ' ').replace(/[ \t]+/g, ' ').trim();
}
function scanFns(src) {
  const spans = []; // {name, start, end}
  let i = 0, depth = 0, mode = 'code', pending = null, prev = '';
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (mode === 's1') { if (c === '\\') i++; else if (c === "'") mode = 'code'; i++; continue; }
    if (mode === 's2') { if (c === '\\') i++; else if (c === '"') mode = 'code'; i++; continue; }
    if (mode === 're') {
      if (c === '\\') { i += 2; continue; }
      if (c === '[') { i++; while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i++; i++; } i++; continue; }
      if (c === '/') mode = 'code';
      i++; continue;
    }
    // code
    if (c === "'") { mode = 's1'; i++; continue; }
    if (c === '"') { mode = 's2'; i++; continue; }
    if (c === '/') {
      if (/[=(,:\[!&|?{};+\-*%<>~^]/.test(prev) || prev === '') { mode = 're'; i++; continue; }
      prev = c; i++; continue;
    }
    if (depth === 0) {
      const m = /^function (\w+)\s*\(/.exec(src.slice(i, i + 60));
      if (m && (i === 0 || /[\s;}]/.test(src[i - 1] || ' '))) pending = { name: m[1], start: i };
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0 && pending) { spans.push({ name: pending.name, start: pending.start, end: i + 1 }); pending = null; }
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return spans;
}
function topFns(src) {
  const out = {};
  scanFns(src).forEach(sp => { out[sp.name] = src.slice(sp.start, sp.end); });
  return out;
}
module.exports = { strip, scanFns, topFns };
