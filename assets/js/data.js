/* =====================================================================
   PROMAX — Cargador de inventario compartido
   Fuente configurable en config.js (endpoints.inventorySource).
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.PROMAX || {};
  var cache = null;

  function normalize(r) {
    var gallery = Array.isArray(r.gallery) ? r.gallery : [];
    var cover = r.cover_image || gallery[0] || "https://via.placeholder.com/800x500?text=Sin+Foto";
    return {
      id: r.id || r.stock || ((r.year || "") + "-" + (r.make || "") + "-" + (r.model || "")).toLowerCase().replace(/\s+/g, "-"),
      year: r.year, make: r.make, model: r.model, trim: r.trim || "",
      bodyType: (r.body_type || "sedan").toLowerCase(),
      price: Number(r.price) || 0, msrp: r.msrp ? Number(r.msrp) : null,
      mileage: Number(r.mileage) || 0,
      fuel: r.fuel || "Gasolina", transmission: r.transmission || "Automática", drivetrain: r.drivetrain || "FWD",
      exteriorColor: r.exterior_color || "", interiorColor: r.interior_color || "",
      vin: r.vin || "", stock: r.stock || "", badge: r.badge || "",
      featured: !!r.featured, photos: gallery.length || 1, image: cover, gallery: gallery,
      features: Array.isArray(r.features) ? r.features : [],
      description: r.description || "",
    };
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    var ep = CFG.endpoints || {};
    var p;
    if (ep.inventorySource === "api" && ep.inventoryApiUrl) {
      var headers = {};
      if (ep.inventoryApiKey) { headers.apikey = ep.inventoryApiKey; headers.Authorization = "Bearer " + ep.inventoryApiKey; }
      p = fetch(ep.inventoryApiUrl, { headers: headers }).then(function (r) { return r.ok ? r.json() : []; });
    } else {
      p = fetch("/assets/data/inventory.json").then(function (r) { return r.ok ? r.json() : []; });
    }
    return p.then(function (rows) {
      cache = (rows || []).map(normalize);
      return cache;
    }).catch(function (e) { console.error("[PROMAX] inventario:", e); return []; });
  }

  window.PMX = window.PMX || {};
  window.PMX.loadInventory = load;
  window.PMX.normalizeVehicle = normalize;
})();
