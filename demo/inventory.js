/* =====================================================================
   PROMAX — Inventario interactivo DEMO (filtros, orden, paginación)
   Estructura pedida por el cliente (Joel):
   - SIN opción "TODOS": categorías directas (default CARROS) y condición
     solo USADOS | NUEVOS.
   - Búsqueda estilo concesionario: MARCA -> MODELO en cascada.
   - Vans separadas: de trabajo (carga) vs de pasajeros.
   - Filtros fáciles de deshacer (chips con ✕ + Limpiar filtros).

   REGLA DE ORO de los filtros (para que NUNCA se contradigan):
   - UN solo lugar decide qué carro pasa: buildPredicate(). Toda la pantalla
     (grilla, conteo, chips, facetas) se deriva de ahí.
   - Los botones rápidos SUVs/Sedanes/Camionetas son ATAJOS a la carrocería
     del panel lateral (mismo estado state.filters.body). Antes vivían en un
     estado aparte y chocaban con los checkboxes -> daba "0 resultados".
   - Al cambiar de categoría se limpian TODOS los refinamientos (una SUV
     marcada no debe arrastrarse a Motos y dejar la lista en 0).
   ===================================================================== */
(function () {
  "use strict";

  PMX.addTranslations({
    es: {
      inv_eyebrow: "Vehículos disponibles", inv_title: "Encuentra tu vehículo ideal",
      inv_sub: "Vehículos seleccionados, precios honestos, financiamiento flexible",
      inv_available: "Disponibles", inv_rating: "Calificación", inv_sold: "Vendidos",
      inv_hero_img: "https://res.cloudinary.com/drbc4wbvw/image/upload/f_auto,q_auto,c_limit,w_1920/v1783051159/INventario_espa_ol_zrqvtz.png",
      inv_hero_img_m: "https://res.cloudinary.com/drbc4wbvw/image/upload/f_auto,q_auto,c_limit,w_1080/v1783051158/inventario_telfno_ntahxa.png",
      qf_20: "Bajo $20k", qf_10: "Bajo $10k", qf_suv: "SUVs", qf_sedan: "Sedanes", qf_truck: "Camionetas",
      cond_used: "Usados", cond_new: "Nuevos",
      vt_work: "De trabajo", vt_pass: "De pasajeros",
      sel_make: "Marca: todas", sel_model: "Modelo: todos", sel_model_wait: "Modelo (elige marca)",
      inv_search_ph: "Buscar por marca, modelo, año...",
      sort_new: "Variado", sort_pa: "Precio: menor a mayor", sort_pd: "Precio: mayor a menor",
      sort_ma: "Millaje: menor a mayor", sort_yd: "Año: nuevo a viejo",
      inv_filters: "Filtros", inv_refine: "Refinar búsqueda", inv_clear: "Limpiar filtros",
      f_make: "Marca", f_model: "Modelo", f_body: "Carrocería", f_price: "Precio", f_year: "Año", f_mileage: "Millaje",
      ph_min: "Mín", ph_max: "Máx", ph_from: "Desde", ph_to: "Hasta", ph_maxmi: "Millas máx",
      inv_match: "vehículos", inv_help: "¿Necesitas ayuda? Escríbenos",
      inv_empty_t: "Sin resultados", inv_empty_s: "Ajusta los filtros o explora todo el inventario", inv_reset: "Reiniciar",
      inv_none_t: "Inventario en actualización", inv_none_s: "Estamos cargando nuevos vehículos. Vuelve pronto o escríbenos y te ayudamos a encontrar tu carro.", inv_none_cta: "Contáctanos",
      inv_err_t: "No se pudo cargar el inventario", inv_err_s: "Recarga la página o intenta más tarde.",
      btn_details: "Ver Detalles", btn_prequal: "Pre-Calificar", prev: "Anterior", next: "Siguiente", price_ask: "Consultar precio",
      body_suv: "SUV", body_sedan: "SEDÁN", body_truck: "CAMIONETA", body_coupe: "COUPÉ",
      body_hatchback: "HATCHBACK", body_van: "VAN", body_wagon: "FAMILIAR", body_convertible: "CONVERTIBLE", body_minivan: "MINIVAN",
      inv_empty_cat_t: "Próximamente",
      inv_empty_cat_s: "Aún no hay {cat} publicados. Escríbenos y te conseguimos el tuyo.",
      inv_ask_cta: "Pregúntanos por WhatsApp",
    },
    en: {
      inv_eyebrow: "Available vehicles", inv_title: "Find your perfect ride",
      inv_sub: "Hand-picked vehicles, honest pricing, flexible financing",
      inv_available: "Available", inv_rating: "Rating", inv_sold: "Sold",
      inv_hero_img: "https://res.cloudinary.com/drbc4wbvw/image/upload/f_auto,q_auto,c_limit,w_1920/v1783051158/inventory_i_gwbhxv.png",
      inv_hero_img_m: "https://res.cloudinary.com/drbc4wbvw/image/upload/f_auto,q_auto,c_limit,w_1080/v1783051159/inventory_tefl_fwp1xt.png",
      qf_20: "Under $20k", qf_10: "Under $10k", qf_suv: "SUVs", qf_sedan: "Sedans", qf_truck: "Trucks",
      cond_used: "Used", cond_new: "New",
      vt_work: "Work vans", vt_pass: "Passenger",
      sel_make: "Make: all", sel_model: "Model: all", sel_model_wait: "Model (pick a make)",
      inv_search_ph: "Search by make, model, year...",
      sort_new: "Varied", sort_pa: "Price: low to high", sort_pd: "Price: high to low",
      sort_ma: "Mileage: low to high", sort_yd: "Year: new to old",
      inv_filters: "Filters", inv_refine: "Refine search", inv_clear: "Clear filters",
      f_make: "Make", f_model: "Model", f_body: "Body type", f_price: "Price", f_year: "Year", f_mileage: "Mileage",
      ph_min: "Min", ph_max: "Max", ph_from: "From", ph_to: "To", ph_maxmi: "Max miles",
      inv_match: "vehicles", inv_help: "Need help? Contact us",
      inv_empty_t: "No results", inv_empty_s: "Adjust filters or browse all inventory", inv_reset: "Reset",
      inv_none_t: "Inventory updating", inv_none_s: "We're loading new vehicles. Check back soon or contact us and we'll help you find your car.", inv_none_cta: "Contact Us",
      inv_err_t: "Unable to load inventory", inv_err_s: "Refresh the page or try later.",
      btn_details: "View Details", btn_prequal: "Pre-Qualify", prev: "Prev", next: "Next", price_ask: "Call for price",
      body_suv: "SUV", body_sedan: "SEDAN", body_truck: "TRUCK", body_coupe: "COUPE",
      body_hatchback: "HATCHBACK", body_van: "VAN", body_wagon: "WAGON", body_convertible: "CONVERTIBLE", body_minivan: "MINIVAN",
      inv_empty_cat_t: "Coming soon",
      inv_empty_cat_s: "No {cat} published yet. Message us and we'll find yours.",
      inv_ask_cta: "Ask us on WhatsApp",
    },
  });

  var PER = 9, CARS = [], $ = function (s, r) { return (r || document).querySelector(s); };
  var DEFAULT_CAT = "cars";
  // Botones rápidos que en realidad son atajos a la CARROCERÍA (state.filters.body).
  // Los demás (under-20k/under-10k) son atajos de PRECIO (state.quick).
  var BODY_QUICK = ["suv", "sedan", "truck"];
  var state = { category: DEFAULT_CAT, quick: "all", condition: "used", vanType: "", search: "", sort: "new", page: 1,
    filters: { make: [], model: [], body: [], priceMin: null, priceMax: null, yearMin: null, yearMax: null, mileageMax: null } };

  // Vans de TRABAJO (carga) vs de PASAJEROS — clasificación por modelo
  var VAN_WORK_RE = /\b(transit|promaster|pro ?master|express|savana|sprinter|metris|nv ?[123]500|nv ?200|cargo|cutaway|box)\b/i;
  function isWorkVan(c) { return VAN_WORK_RE.test([c.make, c.model, c.trim, c.bodyType].join(" ")); }

  function bodyLabel(b) {
    if (!b) return "";
    var t = PMX.t("body_" + b);
    // Si no hay traducción, PMX.t devuelve la misma clave ("body_van"): en ese
    // caso mostramos la palabra en mayúscula, nunca el slug crudo.
    return (t && t !== "body_" + b) ? t : String(b).replace(/_/g, " ").toUpperCase();
  }
  function canonModel(m) { return String(m == null ? "" : m).trim().toUpperCase(); }
  function condMatch(c) { return state.condition === "new" ? c.condition === "new" : c.condition !== "new"; }
  // Escapa texto antes de meterlo en innerHTML (el buscador es texto libre del
  // usuario: sin esto, escribir <img onerror=...> ejecutaría script — self-XSS).
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

  // Base = solo categoría (para conteos de la barra y ensureConditionFits)
  function inCategory(list) {
    return (list || CARS).filter(function (c) { return c.category === state.category; });
  }
  // Base = categoría + condición (para armar selects y facetas de carrocería,
  // que deben reflejar lo que el usuario está viendo: usados o nuevos).
  function inCatCond() {
    return CARS.filter(function (c) { return c.category === state.category && condMatch(c); });
  }

  // Broker = variedad: en el orden por defecto INTERCALAMOS las marcas para que
  // NO salgan varios carros seguidos de la misma marca (se veia como si solo
  // promocionaramos una). Cada carga baraja (_shuf, fijado una sola vez) y
  // luego, carro a carro, elegimos el siguiente de una marca DISTINTA a la
  // anterior; solo se repite marca cuando ya no queda de otra. Es estable
  // durante la sesion, asi que la paginacion no "salta".
  function diversify(list) {
    var pool = list.slice().sort(function (a, b) { return (a._shuf || 0) - (b._shuf || 0); });
    var out = [], lastMake = null;
    while (pool.length) {
      var idx = 0;
      for (var i = 0; i < pool.length; i++) { if (pool[i].make !== lastMake) { idx = i; break; } }
      var c = pool.splice(idx, 1)[0];
      out.push(c); lastMake = c.make;
    }
    return out;
  }

  // ---- FUENTE ÚNICA DE VERDAD: un carro pasa el filtro si cumple TODO esto ----
  function buildPredicate() {
    var f = state.filters;
    // Normalizamos espacios/guiones para que "mercedes benz" encuentre
    // "Mercedes-Benz" y "f 250" encuentre "F-250" (canonMake usa guion).
    var q = state.search ? state.search.toLowerCase().replace(/[\s\-]+/g, " ") : null;
    var cat = state.category, quick = state.quick, vanType = state.vanType;
    return function (c) {
      if (c.category !== cat) return false;
      if (!condMatch(c)) return false;
      if (cat === "vans" && vanType) {
        var w = isWorkVan(c);
        if (vanType === "work" && !w) return false;
        if (vanType === "pass" && w) return false;
      }
      if (quick === "under-20k") { if (!(c.price > 0 && c.price < 20000)) return false; }
      else if (quick === "under-10k") { if (!(c.price > 0 && c.price < 10000)) return false; }
      if (q && (c.year + " " + c.make + " " + c.model + " " + c.trim).toLowerCase().replace(/[\s\-]+/g, " ").indexOf(q) < 0) return false;
      if (f.make.length && f.make.indexOf(c.make) < 0) return false;
      if (f.model.length && f.model.indexOf(canonModel(c.model)) < 0) return false;
      if (f.body.length && f.body.indexOf(c.bodyType) < 0) return false;
      if (f.priceMin != null && !(c.price >= f.priceMin)) return false;
      // Precio 0 = "Consultar precio" (precio desconocido): NO cuenta como
      // "dentro de un techo de precio" (igual que los atajos Bajo $20k/$10k).
      if (f.priceMax != null && !(c.price > 0 && c.price <= f.priceMax)) return false;
      if (f.yearMin != null && !(c.year >= f.yearMin)) return false;
      if (f.yearMax != null && !(c.year <= f.yearMax)) return false;
      if (f.mileageMax != null && !(c.mileage <= f.mileageMax)) return false;
      return true;
    };
  }

  function applyAll() {
    var r = CARS.filter(buildPredicate());
    switch (state.sort) {
      case "price-asc": r.sort(function (a, b) { return a.price - b.price; }); break;
      case "price-desc": r.sort(function (a, b) { return b.price - a.price; }); break;
      case "mileage-asc": r.sort(function (a, b) { return a.mileage - b.mileage; }); break;
      case "year-desc": r.sort(function (a, b) { return b.year - a.year; }); break;
      default: r = diversify(r); // "Variado": mezcla intercalada por marca
    }
    return r;
  }

  function card(c) {
    var save = c.msrp && c.msrp > c.price ? c.msrp - c.price : 0;
    // Etiqueta superior: para carros la carrocería; para otras categorías, la categoría.
    var typeLabel = (c.category && c.category !== "cars") ? PMX.catLabel(c.category) : bodyLabel(c.bodyType);
    // Specs: solo los datos que existan (motos de agua no llevan millaje/tracción).
    var specs = [];
    if (c.mileage > 0) specs.push(PMX.num(c.mileage) + " mi");
    if (c.fuel) specs.push(c.fuel);
    if (c.drivetrain) specs.push(c.drivetrain);
    return '<article class="pmx-vcard">' +
      '<a href="/demo/vehicle/?id=' + encodeURIComponent(c.id) + '" style="text-decoration:none;color:inherit;display:contents">' +
      '<div class="pmx-vcard__img" style="background-image:url(\'' + c.image + '\')">' +
        (c.badge ? '<span class="pmx-vcard__badge">' + c.badge + '</span>' : '') +
        (typeLabel ? '<span class="pmx-vcard__type">' + typeLabel + '</span>' : '') +
        '<button class="pmx-vcard__share" type="button" data-share-id="' + c.id + '" aria-label="' + PMX.t("act_share") + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>' +
      '</div></a>' +
      '<div class="pmx-vcard__body">' +
        '<h3 class="pmx-vcard__title">' + c.year + ' ' + c.make + ' ' + c.model + (c.trim ? ' ' + c.trim : '') + '</h3>' +
        (specs.length ? '<div class="pmx-vcard__specs">' + specs.map(function (s) { return "<span>" + s + "</span>"; }).join("") + '</div>' : '') +
        '<div class="pmx-vcard__price">' + (c.price > 0 ? PMX.money(c.price) : PMX.t("price_ask")) + (save ? '<small>' + PMX.money(c.msrp) + '</small>' : '') + '</div>' +
        '<div class="pmx-vcard__actions">' +
          '<a href="/demo/vehicle/?id=' + encodeURIComponent(c.id) + '" class="pmx-btn pmx-btn--primary">' + PMX.t("btn_details") + '</a>' +
          '<a href="/financing/apply/?vin=' + c.id + '" class="pmx-btn pmx-btn--ghost">' + PMX.t("btn_prequal") + '</a>' +
        '</div>' +
      '</div></article>';
  }

  /* ----- Chips de categoría (las 6 de config.js, SIN "todo") ----- */
  function renderCats() {
    var host = $("#pmxCats"); if (!host) return;
    var counts = {};
    CARS.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
    var chips = (PMX.categories ? PMX.categories() : []).map(function (c) {
      var ic = PMX.catSvg ? '<span class="pmx-cati pmx-cati--sm">' + PMX.catSvg(c.slug) + '</span> ' : "";
      return { slug: c.slug, icon: ic, label: PMX.catLabel(c.slug), n: counts[c.slug] || 0 };
    });
    host.innerHTML = chips.map(function (c) {
      return '<button type="button" class="pmx-chip' + (state.category === c.slug ? " active" : "") + '" data-cat="' + c.slug + '">' +
        c.icon + c.label + ' <span class="pmx-chip__n">' + c.n + '</span></button>';
    }).join("");
  }

  // Si la condición activa deja la categoría en 0 pero la otra sí tiene
  // resultados, cambia sola (ej. los Jet Ski son todos NUEVOS: al entrar no
  // debe verse "sin resultados" por estar parado en USADOS).
  function ensureConditionFits() {
    var base = inCategory(CARS);
    var news = 0, used = 0;
    base.forEach(function (c) { if (c.condition === "new") news++; else used++; });
    if (state.condition === "used" && !used && news) state.condition = "new";
    else if (state.condition === "new" && !news && used) state.condition = "used";
    syncCondTabs();
  }
  function syncCondTabs() {
    document.querySelectorAll(".pmx-condtab").forEach(function (b) {
      b.classList.toggle("active", b.dataset.cond === state.condition);
    });
  }

  function renderVanTypes() {
    var host = $("#pmxVanTypes"); if (!host) return;
    host.style.display = state.category === "vans" ? "inline-flex" : "none";
    host.querySelectorAll("[data-vantype]").forEach(function (b) {
      b.classList.toggle("active", state.vanType === b.dataset.vantype);
    });
  }

  // Botones rápidos: PRECIO siempre visibles; CARROCERÍA (SUVs/Sedanes/
  // Camionetas) solo se muestran donde esa carrocería existe (categoría +
  // condición actuales) y su estado activo sale de state.filters.body.
  function renderQuickButtons() {
    var present = {};
    inCatCond().forEach(function (c) { if (c.bodyType) present[c.bodyType] = 1; });
    document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (b) {
      var v = b.dataset.quick;
      if (BODY_QUICK.indexOf(v) > -1) {
        var show = present[v] || state.filters.body.indexOf(v) > -1;
        b.style.display = show ? "" : "none";
        b.classList.toggle("active", state.filters.body.indexOf(v) > -1);
      } else {
        b.style.display = "";
        b.classList.toggle("active", state.quick === v);
      }
    });
  }

  function clearRefinements() {
    state.quick = "all"; state.vanType = ""; state.search = "";
    state.filters = { make: [], model: [], body: [], priceMin: null, priceMax: null, yearMin: null, yearMax: null, mileageMax: null };
    var s = $("#pmxSearch"); if (s) s.value = "";
    document.querySelectorAll('.pmx-sidebar input[type=number]').forEach(function (i) { i.value = ""; });
    // Los checkboxes de carrocería se re-pintan en render() desde filters.body.
  }

  function setCategory(slug) {
    state.category = slug; state.page = 1;
    clearRefinements();          // categorías = inventarios distintos: empezamos limpio
    // Arrancamos siempre en USADOS (default) y dejamos que ensureConditionFits
    // salte a NUEVOS solo si la categoría no tiene usados. Así una condición
    // auto-forzada (ej. Jet Ski = todos nuevos) no se "arrastra" a la próxima.
    state.condition = "used";
    ensureConditionFits();
    buildMakeSelect(); buildModelSelect();
    renderCats(); render();
    // Refleja la categoría en la URL (para compartir el filtro)
    try {
      var u = new URL(location.href);
      if (slug === DEFAULT_CAT) u.searchParams.delete("cat"); else u.searchParams.set("cat", slug);
      history.replaceState(null, "", u.pathname + (u.search || ""));
    } catch (e) {}
  }

  /* ----- MARCA -> MODELO en cascada (estilo concesionario) ----- */
  function buildMakeSelect() {
    var sel = $("#pmxMakeSel"); if (!sel) return;
    var counts = {};
    inCatCond().forEach(function (c) { if (c.make) counts[c.make] = (counts[c.make] || 0) + 1; });
    var makes = Object.keys(counts).sort();
    var cur = state.filters.make[0] || "";
    if (cur && makes.indexOf(cur) < 0) { cur = ""; state.filters.make = []; state.filters.model = []; }
    sel.innerHTML = '<option value="">' + PMX.t("sel_make") + '</option>' + makes.map(function (m) {
      return '<option value="' + m.replace(/"/g, "&quot;") + '"' + (m === cur ? " selected" : "") + '>' + m.toUpperCase() + ' (' + counts[m] + ')</option>';
    }).join("");
  }
  function buildModelSelect() {
    var sel = $("#pmxModelSel"); if (!sel) return;
    var make = state.filters.make[0] || "";
    if (!make) {
      state.filters.model = [];
      sel.innerHTML = '<option value="">' + PMX.t("sel_model_wait") + '</option>';
      sel.disabled = true;
      return;
    }
    var counts = {};
    inCatCond().forEach(function (c) {
      if (c.make === make && c.model) { var k = canonModel(c.model); counts[k] = (counts[k] || 0) + 1; }
    });
    var models = Object.keys(counts).sort();
    var cur = state.filters.model[0] || "";
    if (cur && models.indexOf(cur) < 0) { cur = ""; state.filters.model = []; }
    sel.disabled = false;
    sel.innerHTML = '<option value="">' + PMX.t("sel_model") + '</option>' + models.map(function (m) {
      return '<option value="' + m.replace(/"/g, "&quot;") + '"' + (m === cur ? " selected" : "") + '>' + m + ' (' + counts[m] + ')</option>';
    }).join("");
  }

  // Etiquetas legibles para los chips de rango (antes salía "priceMin: 15000")
  function chipLabel(k, v) {
    if (k === "priceMin") return PMX.t("f_price") + " ≥ " + PMX.money(v);
    if (k === "priceMax") return PMX.t("f_price") + " ≤ " + PMX.money(v);
    if (k === "yearMin") return PMX.t("f_year") + " ≥ " + v;
    if (k === "yearMax") return PMX.t("f_year") + " ≤ " + v;
    if (k === "mileageMax") return PMX.t("f_mileage") + " ≤ " + PMX.num(v) + " mi";
    return String(v);
  }

  function renderChips() {
    var chips = [];
    if (state.quick === "under-20k" || state.quick === "under-10k")
      chips.push({ k: "quick", v: state.quick, l: PMX.t(state.quick === "under-20k" ? "qf_20" : "qf_10") });
    if (state.vanType) chips.push({ k: "vantype", v: state.vanType, l: PMX.t(state.vanType === "work" ? "vt_work" : "vt_pass") });
    if (state.search) chips.push({ k: "search", v: state.search, l: '"' + state.search + '"' });
    state.filters.make.forEach(function (m) { chips.push({ k: "make", v: m, l: m }); });
    state.filters.model.forEach(function (m) { chips.push({ k: "model", v: m, l: m }); });
    state.filters.body.forEach(function (b) { chips.push({ k: "body", v: b, l: bodyLabel(b) }); });
    ["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax"].forEach(function (key) {
      if (state.filters[key] != null) chips.push({ k: key, v: state.filters[key], l: chipLabel(key, state.filters[key]) });
    });
    var host = $("#pmxChips");
    host.innerHTML = chips.map(function (c) {
      return '<span class="pmx-chip" data-k="' + c.k + '" data-v="' + esc(c.v) + '">' + esc(c.l) + ' ✕</span>';
    }).join("");
    $("#pmxClear").style.display = chips.length ? "inline-flex" : "none";
    var fc = $("#pmxFilterCount"); if (fc) fc.textContent = chips.length || "";
  }

  // Facetas de CARROCERÍA: solo las que existen en la categoría + condición
  // actuales, con su conteo real. Se re-pinta en cada render, tomando el
  // "marcado" desde state.filters.body (así los atajos SUVs/Sedanes y los
  // checkboxes SIEMPRE coinciden). Si no hay carrocerías (motos, jet ski),
  // se oculta el grupo entero.
  function renderBodyFacet() {
    var host = $("#pmxBody"); if (!host) return;
    var group = host.closest(".pmx-fg");
    var counts = {};
    inCatCond().forEach(function (c) { if (c.bodyType) counts[c.bodyType] = (counts[c.bodyType] || 0) + 1; });
    state.filters.body.forEach(function (b) { if (counts[b] == null) counts[b] = 0; });
    var keys = Object.keys(counts).sort();
    if (!keys.length) { host.innerHTML = ""; if (group) group.style.display = "none"; return; }
    if (group) group.style.display = "";
    host.innerHTML = keys.map(function (b) {
      var on = state.filters.body.indexOf(b) > -1 ? " checked" : "";
      return '<label class="pmx-check"><input type="checkbox" data-ft="body" value="' + b + '"' + on + '><span>' + bodyLabel(b) + '</span><span class="pmx-count">' + counts[b] + '</span></label>';
    }).join("");
  }

  function renderPagination(total) {
    var pages = Math.ceil(total / PER), host = $("#pmxPagination");
    if (pages <= 1) { host.innerHTML = ""; return; }
    var h = '<button class="pmx-page" data-page="' + (state.page - 1) + '"' + (state.page <= 1 ? " disabled" : "") + '>‹ ' + PMX.t("prev") + '</button>';
    for (var i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= state.page - 1 && i <= state.page + 1))
        h += '<button class="pmx-page ' + (i === state.page ? "active" : "") + '" data-page="' + i + '">' + i + '</button>';
      else if (i === state.page - 2 || i === state.page + 2) h += '<span class="pmx-page pmx-page--dots">…</span>';
    }
    h += '<button class="pmx-page" data-page="' + (state.page + 1) + '"' + (state.page >= pages ? " disabled" : "") + '>' + PMX.t("next") + ' ›</button>';
    host.innerHTML = h;
  }

  function hasRefinements() {
    var f = state.filters;
    return state.quick !== "all" || !!state.search || !!state.vanType || f.make.length || f.model.length || f.body.length ||
      f.priceMin != null || f.priceMax != null || f.yearMin != null || f.yearMax != null || f.mileageMax != null;
  }
  function emptyBlock() {
    // Vacío por FILTROS: botón para reiniciarlos. Vacío porque la categoría no
    // tiene unidades: mensaje amigable + CTA de WhatsApp.
    if (hasRefinements()) {
      return '<div class="pmx-empty"><h3>' + PMX.t("inv_empty_t") + '</h3><p>' + PMX.t("inv_empty_s") + '</p><button class="pmx-btn pmx-btn--primary" id="pmxReset">' + PMX.t("inv_reset") + '</button></div>';
    }
    var label = PMX.catLabel(state.category).toLowerCase();
    var ask = (PMX.lang && PMX.lang() === "en")
      ? "Hi Promax, I'm looking for " + label + ". Can you help me find one?"
      : "Hola Promax, estoy buscando " + label + ". ¿Me ayudan a conseguirlo?";
    return '<div class="pmx-empty"><h3>' + PMX.t("inv_empty_cat_t") + '</h3>' +
      '<p>' + PMX.t("inv_empty_cat_s").replace("{cat}", label) + '</p>' +
      '<a class="pmx-btn pmx-btn--wa" target="_blank" rel="noopener" href="' + (PMX.waUrl ? PMX.waUrl(ask) : "#") + '">' + PMX.t("inv_ask_cta") + '</a></div>';
  }

  function render() {
    var filtered = applyAll(), total = filtered.length;
    // Página fuera de rango (p.ej. al filtrar se reducen las páginas): reencuadra
    var pages = Math.max(1, Math.ceil(total / PER));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PER, paged = filtered.slice(start, start + PER);
    $("#pmxCount").textContent = total;
    $("#pmxStatCount").textContent = CARS.length;
    var grid = $("#pmxGrid");
    grid.innerHTML = total ? paged.map(card).join("") : emptyBlock();
    var rb = $("#pmxReset"); if (rb) rb.addEventListener("click", reset);
    renderChips();
    renderBodyFacet();     // carrocerías de la categoría/condición + marcado sincronizado
    renderQuickButtons();  // atajos precio/carrocería: visibilidad y estado activo
    renderVanTypes();
    renderPagination(total);
    if (window.PMX && PMX.reveal) PMX.reveal(grid);
  }

  function reset() {
    // Reinicia FILTROS pero respeta dónde está parado el usuario (categoría);
    // la condición vuelve a la que tenga resultados en esa categoría.
    clearRefinements();
    state.sort = "new"; state.page = 1; state.condition = "used";
    var so = $("#pmxSort"); if (so) so.value = "new";
    ensureConditionFits();
    buildMakeSelect(); buildModelSelect();
    render();
  }

  function wire() {
    document.querySelectorAll(".pmx-condtab").forEach(function (b) {
      b.addEventListener("click", function () {
        state.condition = b.dataset.cond; state.page = 1;
        syncCondTabs();
        buildMakeSelect(); buildModelSelect(); // los conteos dependen de la condición
        render();
      });
    });
    document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.dataset.quick;
        if (BODY_QUICK.indexOf(v) > -1) {
          // Atajo de CARROCERÍA: enciende/apaga en el mismo estado que los checkboxes
          var i = state.filters.body.indexOf(v);
          if (i > -1) state.filters.body.splice(i, 1); else state.filters.body.push(v);
        } else {
          // Atajo de PRECIO (toque en el activo = se apaga)
          state.quick = (state.quick === v) ? "all" : v;
        }
        state.page = 1; render();
      });
    });
    document.querySelectorAll("[data-vantype]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.vanType = state.vanType === b.dataset.vantype ? "" : b.dataset.vantype;
        state.page = 1; render();
      });
    });
    var mk = $("#pmxMakeSel");
    if (mk) mk.addEventListener("change", function () {
      state.filters.make = mk.value ? [mk.value] : [];
      state.filters.model = [];
      buildModelSelect();
      state.page = 1; render();
    });
    var md = $("#pmxModelSel");
    if (md) md.addEventListener("change", function () {
      state.filters.model = md.value ? [md.value] : [];
      state.page = 1; render();
    });
    var s = $("#pmxSearch"); s.addEventListener("input", function () { state.search = s.value.trim(); state.page = 1; render(); });
    $("#pmxSort").addEventListener("change", function (e) { state.sort = e.target.value; state.page = 1; render(); });
    [["pmxPriceMin", "priceMin"], ["pmxPriceMax", "priceMax"], ["pmxYearMin", "yearMin"], ["pmxYearMax", "yearMax"], ["pmxMileageMax", "mileageMax"]].forEach(function (p) {
      $("#" + p[0]).addEventListener("change", function (e) {
        var raw = e.target.value.trim();
        state.filters[p[1]] = raw === "" ? null : parseInt(raw, 10);
        if (isNaN(state.filters[p[1]])) state.filters[p[1]] = null;
        state.page = 1; render();
      });
    });
    // Checkboxes de carrocería (delegación: el grupo se re-pinta en cada render)
    var bodyHost = $("#pmxBody");
    if (bodyHost) bodyHost.addEventListener("change", function (e) {
      var inp = e.target.closest('input[data-ft="body"]'); if (!inp) return;
      var v = inp.value;
      if (inp.checked) { if (state.filters.body.indexOf(v) < 0) state.filters.body.push(v); }
      else state.filters.body = state.filters.body.filter(function (x) { return x !== v; });
      state.page = 1; render();
    });
    $("#pmxChips").addEventListener("click", function (e) {
      var chip = e.target.closest(".pmx-chip"); if (!chip) return;
      var k = chip.dataset.k, v = chip.dataset.v;
      if (k === "quick") { state.quick = "all"; }
      else if (k === "vantype") { state.vanType = ""; }
      else if (k === "search") { state.search = ""; $("#pmxSearch").value = ""; }
      else if (k === "make") { state.filters.make = []; state.filters.model = []; buildMakeSelect(); buildModelSelect(); }
      else if (k === "model") { state.filters.model = []; buildModelSelect(); }
      else if (["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax"].indexOf(k) > -1) {
        state.filters[k] = null;
        var map = { priceMin: "pmxPriceMin", priceMax: "pmxPriceMax", yearMin: "pmxYearMin", yearMax: "pmxYearMax", mileageMax: "pmxMileageMax" };
        var el = $("#" + map[k]); if (el) el.value = "";
      } else if (k === "body") {
        state.filters.body = state.filters.body.filter(function (x) { return x !== v; });
      }
      state.page = 1; render();
    });
    $("#pmxClear").addEventListener("click", reset);
    $("#pmxPagination").addEventListener("click", function (e) {
      var b = e.target.closest(".pmx-page"); if (!b || b.disabled || !b.dataset.page) return;
      state.page = parseInt(b.dataset.page, 10); render();
      window.scrollTo({ top: $("#pmxResults").offsetTop - 180, behavior: "smooth" });
    });
    var sb = $("#pmxSidebar"), ov = $("#pmxOverlay");
    $("#pmxFilterBtn").addEventListener("click", function () { sb.classList.add("open"); ov.classList.add("open"); document.body.style.overflow = "hidden"; });
    function close() { sb.classList.remove("open"); ov.classList.remove("open"); document.body.style.overflow = ""; }
    $("#pmxSidebarClose").addEventListener("click", close); ov.addEventListener("click", close);

    // Chips de categoría
    var cats = $("#pmxCats");
    if (cats) cats.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return;
      setCategory(b.dataset.cat);
    });

    // Compartir desde la tarjeta (el botón vive dentro del enlace: frenamos la navegación)
    $("#pmxGrid").addEventListener("click", function (e) {
      var b = e.target.closest("[data-share-id]"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var id = b.getAttribute("data-share-id");
      var c = CARS.filter(function (x) { return String(x.id) === String(id); })[0];
      if (!c || !PMX.share) return;
      var title = [c.year, c.make, c.model, c.trim].filter(Boolean).join(" ") + (c.price > 0 ? " · " + PMX.money(c.price) : "");
      var base = (PMX.cfg && PMX.cfg.siteUrl) || location.origin;
      PMX.share({ title: title, url: base + "/demo/vehicle/?id=" + encodeURIComponent(c.id) });
    });

    // Al cambiar idioma, re-pinta chips, selects y tarjetas con las etiquetas traducidas
    window.addEventListener("pmx-lang", function () { renderCats(); buildMakeSelect(); buildModelSelect(); render(); });
  }

  PMX.loadInventory().then(function (cars) {
    CARS = cars;
    // Barajado estable por sesion: da variedad y no reordena al paginar/filtrar.
    CARS.forEach(function (c) { c._shuf = Math.random(); });
    if (!CARS.length) {
      $("#pmxGrid").innerHTML = '<div class="pmx-empty"><h3>' + PMX.t("inv_none_t") + '</h3><p>' + PMX.t("inv_none_s") + '</p><a class="pmx-btn pmx-btn--primary" href="/contact/">' + PMX.t("inv_none_cta") + '</a></div>';
      [".pmx-toolbar", ".pmx-results__bar", "#pmxSidebar"].forEach(function (s) { var el = document.querySelector(s); if (el) el.style.display = "none"; });
      var main = document.querySelector(".pmx-invmain"); if (main) main.style.display = "block";
      var stat = $("#pmxStatCount"); if (stat) stat.textContent = "0";
      return;
    }
    var url = new URLSearchParams(location.search);
    // Categoría desde la URL (?cat=cars|trucks_machinery|vans|motorcycles|utv|watercraft)
    var cat = url.get("cat");
    if (cat && (PMX.categories ? PMX.categories() : []).some(function (c) { return c.slug === cat; })) {
      state.category = cat;
    }
    // ?filter= solo trae atajos de PRECIO (footer/sitemap). SUVs/Sedanes/etc.
    // no llegan por URL; son atajos de carrocería dentro de la página.
    var filt = url.get("filter");
    if (filt === "under-20k" || filt === "under-10k") state.quick = filt;
    var cond = url.get("cond");
    if (cond === "new" || cond === "used") state.condition = cond;
    ensureConditionFits();
    buildMakeSelect(); buildModelSelect();
    wire(); renderCats(); render();
  });
})();
