/* =====================================================================
   PROMAX — Cargador de inventario compartido
   Fuente configurable en config.js (endpoints.inventorySource).

   ESCALA: los LISTADOS (catálogo, home, similares) cargan solo campos
   LIVIANOS (sin galería/descripción/equipamiento, que son ~90% del peso)
   y recorren la base por páginas de 1000 (tope de PostgREST). La ficha
   completa de un vehículo se pide aparte con PMX.loadVehicle(id).
   Así el sitio aguanta miles de vehículos sin ahogar el teléfono.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.PROMAX || {};
  var cache = null;

  var CATEGORY_SLUGS = (CFG.categories || []).map(function (c) { return c.slug; });

  // Los dealers guardan la marca en cualquier casing ("CADILLAC", "ford",
  // "Chevrolet"). La unificamos a un formato consistente para que el filtro y
  // las tarjetas no mezclen mayúsculas/minúsculas (y no salgan facetas dobles).
  var MAKE_UP = { GMC: 1, BMW: 1, RAM: 1, GTI: 1, SRT: 1, AMG: 1, "MINI": 0 };
  function canonMake(m) {
    m = String(m == null ? "" : m).trim();
    if (!m) return "";
    var t = m.toLowerCase().replace(/(^|[\s\-\/])([a-záéíóúñ])/g, function (_, sep, c) { return sep + c.toUpperCase(); });
    ["GMC", "BMW", "RAM", "GTI", "SRT", "AMG"].forEach(function (a) { t = t.replace(new RegExp("\\b" + a + "\\b", "ig"), a); });
    return t;
  }

  // Campos livianos para listados (todo lo que usan tarjetas, filtros y buscador)
  var SLIM = "id,stock,category,year,make,model,trim,body_type,price,msrp,mileage,fuel,transmission,drivetrain,badge,featured,cover_image,created_at";
  var PAGE = 1000; // máximo de filas por respuesta en Supabase/PostgREST

  function normalize(r) {
    // Máximo 5 fotos por producto (regla de negocio; el admin también lo valida).
    var gallery = (Array.isArray(r.gallery) ? r.gallery : []).slice(0, 5);
    var cover = r.cover_image || gallery[0] || "https://via.placeholder.com/800x500?text=Sin+Foto";
    var cat = (r.category || "cars").toLowerCase();
    if (CATEGORY_SLUGS.length && CATEGORY_SLUGS.indexOf(cat) === -1) cat = "cars";
    return {
      id: r.id || r.stock || ((r.year || "") + "-" + (r.make || "") + "-" + (r.model || "")).toLowerCase().replace(/\s+/g, "-"),
      category: cat,
      year: r.year, make: canonMake(r.make), model: r.model, trim: r.trim || "",
      bodyType: (r.body_type || "sedan").toLowerCase(),
      price: Number(r.price) || 0, msrp: r.msrp ? Number(r.msrp) : null,
      mileage: Number(r.mileage) || 0,
      fuel: r.fuel || "Gasolina", transmission: r.transmission || "Automática", drivetrain: r.drivetrain || "FWD",
      exteriorColor: r.exterior_color || "", interiorColor: r.interior_color || "",
      vin: r.vin || "", stock: r.stock || "", badge: r.badge || "",
      featured: !!r.featured, photos: gallery.length || 1, image: cover, gallery: gallery,
      features: Array.isArray(r.features) ? r.features : [],
      description: r.description || "",
      condition: r.condition || (/\b(nuevo|new)\b/i.test(r.badge || "") ? "new" : "used"),
    };
  }

  function apiInfo() {
    var ep = CFG.endpoints || {};
    if (ep.inventorySource !== "api" || !ep.inventoryApiUrl) return null;
    var headers = {};
    if (ep.inventoryApiKey) { headers.apikey = ep.inventoryApiKey; headers.Authorization = "Bearer " + ep.inventoryApiKey; }
    return { url: ep.inventoryApiUrl, headers: headers };
  }
  function slimUrl(api) {
    return api.url.indexOf("select=*") > -1 ? api.url.replace("select=*", "select=" + SLIM) : api.url + "&select=" + SLIM;
  }

  function fetchJson(url, headers) {
    return fetch(url, headers ? { headers: headers } : undefined)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Una página de resultados; con wantCount lee el total del header Content-Range
  function fetchPage(url, headers, offset, wantCount) {
    var h = {};
    for (var k in headers) h[k] = headers[k];
    if (wantCount) h.Prefer = "count=exact";
    return fetch(url + "&limit=" + PAGE + "&offset=" + offset, { headers: h })
      .then(function (res) {
        if (!res.ok) return null;
        var total = null;
        var cr = res.headers.get("content-range");
        if (cr && cr.indexOf("/") > -1) { var t = parseInt(cr.split("/")[1], 10); if (!isNaN(t)) total = t; }
        return res.json().then(function (rows) { return Array.isArray(rows) ? { rows: rows, total: total } : null; });
      })
      .catch(function () { return null; });
  }

  function loadStatic() {
    return fetchJson("/assets/data/inventory.json").then(function (rows) {
      return Array.isArray(rows) ? rows : [];
    });
  }

  // Lista LIVIANA de todo el inventario (para catálogo, home y conteos)
  function load() {
    if (cache) return Promise.resolve(cache);
    var api = apiInfo();
    var live = Promise.resolve(null);
    if (api) {
      var u = slimUrl(api);
      live = fetchPage(u, api.headers, 0, true).then(function (first) {
        if (!first) return null;
        var total = first.total != null ? first.total : first.rows.length;
        if (first.rows.length >= PAGE && total > PAGE) {
          // Hay más de 1000: trae el resto de páginas en paralelo
          var jobs = [];
          for (var off = PAGE; off < total; off += PAGE) jobs.push(fetchPage(u, api.headers, off, false));
          return Promise.all(jobs).then(function (rest) {
            var all = first.rows.slice();
            rest.forEach(function (p) { if (p) all = all.concat(p.rows); });
            return all;
          });
        }
        return first.rows;
      });
    }
    return live.then(function (rows) {
      // Si la base respondió con carros, úsalos; si está vacía o falla, usa el JSON local (respaldo).
      if (Array.isArray(rows) && rows.length) { cache = rows.map(normalize); return cache; }
      return loadStatic().then(function (s) { cache = s.map(normalize); return cache; });
    });
  }

  // Ficha COMPLETA de UN vehículo (galería, descripción, equipamiento) — no
  // descarga todo el inventario para mostrar uno.
  function loadVehicle(id) {
    var api = apiInfo();
    if (api) {
      var url = api.url + "&id=eq." + encodeURIComponent(id) + "&limit=1";
      return fetchJson(url, api.headers).then(function (rows) {
        if (Array.isArray(rows) && rows.length) {
          var m = rows.filter(function (r) { return String(r.id) === String(id); })[0] || rows[0];
          return normalize(m);
        }
        return loadStatic().then(function (s) {
          var r = s.filter(function (x) { return String(x.id || "") === String(id); })[0];
          return r ? normalize(r) : null;
        });
      });
    }
    return load().then(function (cars) {
      return cars.filter(function (c) { return String(c.id) === String(id); })[0] || null;
    });
  }

  // Vehículos similares (liviano): misma categoría, sin el actual
  function loadSimilar(category, excludeId, n) {
    n = n || 6;
    var api = apiInfo();
    var done = function (list) {
      return list.filter(function (c) { return String(c.id) !== String(excludeId); }).slice(0, n);
    };
    if (api) {
      var url = slimUrl(api) + "&category=eq." + encodeURIComponent(category) + "&id=neq." + encodeURIComponent(excludeId) + "&limit=" + (n + 1);
      return fetchJson(url, api.headers).then(function (rows) {
        if (Array.isArray(rows) && rows.length) return done(rows.map(normalize).filter(function (c) { return c.category === category; }));
        return load().then(function (cars) { return done(cars.filter(function (c) { return c.category === category; })); });
      });
    }
    return load().then(function (cars) { return done(cars.filter(function (c) { return c.category === category; })); });
  }

  window.PMX = window.PMX || {};
  window.PMX.loadInventory = load;
  window.PMX.loadVehicle = loadVehicle;
  window.PMX.loadSimilar = loadSimilar;
  window.PMX.normalizeVehicle = normalize;
})();
