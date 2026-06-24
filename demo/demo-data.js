/* =====================================================================
   PROMAX — Cargador de inventario para la página /demo/.
   Lee demo/toyota.json (inventario REAL exportado del listado del dealer)
   en lugar de Supabase. Reutiliza PMX.normalizeVehicle (data.js).
   IMPORTANTE: cargar DESPUÉS de data.js y ANTES de inventory.js / del detalle.
   ===================================================================== */
(function () {
  "use strict";
  window.PMX = window.PMX || {};
  var normalize = window.PMX.normalizeVehicle || function (x) { return x; };
  var cache = null;
  window.PMX.loadInventory = function () {
    if (cache) return Promise.resolve(cache);
    return fetch("/demo/toyota.json")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { cache = (Array.isArray(rows) ? rows : []).map(normalize); return cache; })
      .catch(function () { return []; });
  };
})();
