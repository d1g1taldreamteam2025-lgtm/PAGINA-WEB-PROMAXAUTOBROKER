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
    // Variantes del mismo fabricante -> UNA sola faceta (con y sin guion)
    var low = m.toLowerCase().replace(/[\s\-]+/g, " ");
    var MAP = { "mercedes benz": "Mercedes-Benz", "rolls royce": "Rolls-Royce", "mclaren": "McLaren" };
    if (MAP[low]) return MAP[low];
    var t = m.toLowerCase().replace(/(^|[\s\-\/])([a-záéíóúñ])/g, function (_, sep, c) { return sep + c.toUpperCase(); });
    ["GMC", "BMW", "RAM", "GTI", "SRT", "AMG"].forEach(function (a) { t = t.replace(new RegExp("\\b" + a + "\\b", "ig"), a); });
    return t;
  }

  // Campos livianos para listados (todo lo que usan tarjetas, filtros y buscador)
  var SLIM = "id,stock,category,year,make,model,trim,body_type,price,msrp,mileage,fuel,transmission,drivetrain,condition,badge,featured,cover_image,created_at";
  var PAGE = 1000; // máximo de filas por respuesta en Supabase/PostgREST

  // Placeholder AUTOCONTENIDO (SVG data-URI): si un carro aún no tiene foto, se
  // ve un recuadro gris "Foto próximamente" — NUNCA un recuadro negro/roto.
  // (Antes se usaba via.placeholder.com, que la CSP del sitio bloqueaba -> negro.)
  var NOPHOTO = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>" +
    "<rect width='800' height='500' fill='#e9ecef'/>" +
    "<g fill='none' stroke='#9aa4b2' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'>" +
    "<rect x='320' y='206' width='160' height='104' rx='14'/><circle cx='400' cy='258' r='27'/><path d='M356 206l13-23h62l13 23'/></g>" +
    "<text x='400' y='372' font-family='Arial,Helvetica,sans-serif' font-size='25' fill='#7a828d' text-anchor='middle'>Foto próximamente</text></svg>"
  );

  // Carrocería del DEALER poco fiable: International/DealerCenter manda casi
  // todo como "sedan", así que aparecían una RAM 1500, un Kia Soul o un Mustang
  // bajo el filtro SEDÁN. Regla: el NOMBRE corrige al dealer SOLO cuando es
  // inequívoco — una palabra explícita ("Quad Cab", "Convertible", "Hatchback")
  // o un modelo de UNA sola carrocería (RAM 1500 = camioneta, Mustang = coupé,
  // Sienna = van). Para modelos que vienen en varias carrocerías (Civic,
  // Corolla, Mazda3, Prius pueden ser sedán o hatchback) se RESPETA al dealer,
  // que sí sabe cuál es. Solo carros y vans (un Sea-Doo GTI no es un VW GTI).
  //
  // 1) Palabras EXPLÍCITAS de carrocería (en modelo o versión) — mandan siempre.
  var BODY_WORDS = [
    ["truck", /\b(quad|crew|regular|extended|double|king|mega|super)[\s-]?cab\b|\bpick[\s-]?up\b/],
    ["convertible", /\b(convertible|cabriolet|cabrio|roadster|spyder|spider)\b/],
    ["van", /\b(minivan|cargo van|passenger van|box truck|cutaway)\b/],
    ["coupe", /\bcoupe\b|coupé/],
    ["hatchback", /\b(hatchback|liftback)\b/],
    ["wagon", /\b(wagon|sportwagen)\b/],
    ["suv", /\b(sport utility|crossover)\b/],
    ["sedan", /\bsedan\b/],
  ];
  // 2) Modelos de UNA sola carrocería (el dealer suele equivocarlos): el modelo manda.
  var BODY_DEDICATED = [
    ["van", /\b(sienna|odyssey|pacifica|carnival|transit|promaster|express|savana|sprinter|metris|nv200|grand caravan|caravan)\b/i],
    ["truck", /\b(tacoma|tundra|f[- ]?(150|250|350)|silverado|sierra|ridgeline|frontier|titan|colorado|canyon|ranger|maverick|gladiator|1500|2500|3500)\b/i],
    ["suv", /\b(rav ?4|highlander|4 ?runner|corolla cross|land cruiser|sequoia|venza|bz4x|c-?hr|grand highlander|cr-?v|pilot|hr-?v|passport|rogue|murano|pathfinder|armada|kicks|juke|tucson|santa fe|palisade|kona|venue|sportage|sorento|telluride|seltos|soul|niro|escape|explorer|expedition|edge|bronco|ecosport|equinox|tahoe|suburban|traverse|trailblazer|blazer|trax|compass|cherokee|wrangler|renegade|wagoneer|cx-?(3|30|5|50|9|90)|outback|forester|crosstrek|ascent|rx|nx|gx|lx|ux|mdx|rdx|zdx|qx(50|55|60|80)|x[1-7]|gl[abces]|gle|glc|q[3578]|tiguan|atlas|taos|enclave|encore|envision|terrain|acadia|yukon|escalade|xt[456]|navigator|aviator|corsair|nautilus|range rover|discovery|defender|macan|cayenne)\b/i],
    ["coupe", /\b(mustang|challenger|corvette|camaro|gr ?86|brz|supra|370z|400z)\b/i],
  ];
  // 3) Modelos AMBIGUOS (sedán o hatchback según versión): NO sobreescriben al
  //    dealer; solo sirven para RELLENAR cuando el dealer no mandó carrocería.
  var BODY_AMBIG = [
    ["sedan", /\b(corolla(?!\s*cross)|camry|avalon|crown|mirai|civic|accord|insight|sentra|versa|altima|maxima|elantra|sonata|accent|azera|k5|forte|rio|optima|jetta|passat|arteon|mazda ?[36]|legacy|impreza|is ?(250|300|350)?|es ?(250|300|330|350)?|tlx|ilx|integra|tsx|malibu|impala|cruze|sonic|spark|fusion|taurus|focus|fiesta|charger|continental|mkz|q50|q60)\b/i],
    ["hatchback", /\b(prius|golf|gti|yaris|fit|bolt|leaf|veloster|mini cooper)\b/i],
  ];
  // Carrocería CONFIABLE por el nombre (para SOBREESCRIBIR al dealer): palabra
  // explícita o modelo de una sola carrocería. "" si es ambiguo (respeta al dealer).
  function bodyConfident(make, model, trim) {
    var nm = ((make || "") + " " + (model || "")).toLowerCase();
    var full = nm + " " + String(trim || "").toLowerCase();
    var i;
    for (i = 0; i < BODY_WORDS.length; i++) if (BODY_WORDS[i][1].test(full)) return BODY_WORDS[i][0];
    for (i = 0; i < BODY_DEDICATED.length; i++) if (BODY_DEDICATED[i][1].test(nm)) return BODY_DEDICATED[i][0];
    return "";
  }
  // Carrocería para RELLENAR la que falta (incluye los modelos ambiguos)
  function bodyFill(make, model) {
    var nm = ((make || "") + " " + (model || "")).toLowerCase();
    var i;
    for (i = 0; i < BODY_DEDICATED.length; i++) if (BODY_DEDICATED[i][1].test(nm)) return BODY_DEDICATED[i][0];
    for (i = 0; i < BODY_AMBIG.length; i++) if (BODY_AMBIG[i][1].test(nm)) return BODY_AMBIG[i][0];
    return "";
  }

  function normalize(r) {
    // TODAS las fotos del vehículo (hasta 24 — pedido del cliente: antes se
    // recortaba a 5). El mínimo para aparecer en el catálogo sigue siendo 4.
    var gallery = (Array.isArray(r.gallery) ? r.gallery : []).slice(0, 24);
    var cover = r.cover_image || gallery[0] || NOPHOTO;
    var cat = (r.category || "cars").toLowerCase();
    if (CATEGORY_SLUGS.length && CATEGORY_SLUGS.indexOf(cat) === -1) cat = "cars";
    return {
      id: r.id || r.stock || ((r.year || "") + "-" + (r.make || "") + "-" + (r.model || "")).toLowerCase().replace(/\s+/g, "-"),
      category: cat,
      year: r.year, make: canonMake(r.make), model: r.model, trim: r.trim || "",
      // El NOMBRE manda solo cuando es INEQUÍVOCO (palabra explícita o modelo de
      // una sola carrocería); si es ambiguo se respeta al dealer; y si el dealer
      // no mandó nada, se rellena por el modelo. Así se corrige el "sedan" mal
      // puesto sin volver sedán a un Prius (hatchback) o a un Civic hatchback.
      bodyType: (function () {
        var stored = String(r.body_type || "").toLowerCase();
        var isCarVan = (cat === "cars" || cat === "vans");
        var confident = isCarVan ? bodyConfident(r.make, r.model, r.trim) : "";
        return confident || stored || (isCarVan ? bodyFill(r.make, r.model) : "");
      })(),
      price: Number(r.price) || 0,
      // MSRP corrupto (ej. $205,500 en un Camry de $21,895): si el "precio
      // anterior" es más del doble del precio real, NO se muestra tachado.
      msrp: (function () {
        var p = Number(r.price) || 0, m = Number(r.msrp) || 0;
        return (m > 0 && p > 0 && m <= 2 * p) ? m : null;
      })(),
      mileage: Number(r.mileage) || 0,
      fuel: r.fuel || "Gasolina", transmission: r.transmission || "Automática", drivetrain: r.drivetrain || "FWD",
      exteriorColor: r.exterior_color || "", interiorColor: r.interior_color || "",
      vin: r.vin || "", stock: r.stock || "", badge: r.badge || "",
      featured: !!r.featured, photos: gallery.length || 1, image: cover, gallery: gallery,
      features: Array.isArray(r.features) ? r.features : [],
      description: r.description || "",
      condition: (function () {
        // Regla del negocio (Jorge): un vehículo del AÑO EN CURSO o próximo se
        // muestra como NUEVO aunque el dealer lo liste "usado/pre-owned", salvo
        // que tenga millaje claramente alto. Años anteriores: lo que diga la base.
        var y = Number(r.year) || 0, mi = Number(r.mileage) || 0, cy = new Date().getFullYear();
        if (y >= cy && mi < 30000) return "new";
        return r.condition || (/\b(nuevo|new)\b/i.test(r.badge || "") ? "new" : "used");
      })(),
    };
  }

  function apiInfo() {
    var ep = CFG.endpoints || {};
    if (ep.inventorySource !== "api" || !ep.inventoryApiUrl) return null;
    var headers = {};
    if (ep.inventoryApiKey) { headers.apikey = ep.inventoryApiKey; headers.Authorization = "Bearer " + ep.inventoryApiKey; }
    return { url: ep.inventoryApiUrl, headers: headers };
  }
  // En los LISTADOS (catálogo, home, similares) solo mostramos vehículos con
  // 4+ fotos (regla de Jorge). "gallery->3=not.is.null" = existe el 4º elemento
  // del arreglo de fotos. La ficha directa (loadVehicle) NO usa este filtro, así
  // que un link directo sigue abriendo aunque el carro tenga menos de 4 fotos.
  var MIN4 = "&gallery->3=not.is.null";
  function slimUrl(api) {
    var u = api.url.indexOf("select=*") > -1 ? api.url.replace("select=*", "select=" + SLIM) : api.url + "&select=" + SLIM;
    return u + MIN4;
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
