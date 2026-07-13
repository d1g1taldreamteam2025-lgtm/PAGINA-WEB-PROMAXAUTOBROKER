/* Demo inventory — identical to assets/js/inventory.js except links point to /demo/vehicle/ */
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
      btn_details: "Ver Detalles", btn_prequal: "Pre-Calificar", prev: "Anterior", next: "Siguiente",
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
      btn_details: "View Details", btn_prequal: "Pre-Qualify", prev: "Prev", next: "Next",
      body_suv: "SUV", body_sedan: "SEDAN", body_truck: "TRUCK", body_coupe: "COUPE",
      body_hatchback: "HATCHBACK", body_van: "VAN", body_wagon: "WAGON", body_convertible: "CONVERTIBLE", body_minivan: "MINIVAN",
      inv_empty_cat_t: "Coming soon",
      inv_empty_cat_s: "No {cat} published yet. Message us and we'll find yours.",
      inv_ask_cta: "Ask us on WhatsApp",
    },
  });

  var PER = 9, CARS = [], $ = function (s, r) { return (r || document).querySelector(s); };
  var DEFAULT_CAT = "cars";
  var state = { category: DEFAULT_CAT, quick: "all", condition: "used", vanType: "", search: "", sort: "new", page: 1,
    filters: { make: [], model: [], body: [], priceMin: null, priceMax: null, yearMin: null, yearMax: null, mileageMax: null } };

  var VAN_WORK_RE = /\b(transit|promaster|pro ?master|express|savana|sprinter|metris|nv ?[123]500|nv ?200|cargo|cutaway|box)\b/i;
  function isWorkVan(c) { return VAN_WORK_RE.test([c.make, c.model, c.trim, c.bodyType].join(" ")); }

  function bodyLabel(b) {
    if (!b) return "";
    var t = PMX.t("body_" + b);
    return (t && t !== "body_" + b) ? t : String(b).replace(/_/g, " ").toUpperCase();
  }
  function canonModel(m) { return String(m == null ? "" : m).trim().toUpperCase(); }

  function inCategory(list) {
    return list.filter(function (c) { return c.category === state.category; });
  }

  // Broker = variedad: en el orden por defecto INTERCALAMOS las marcas para que
  // NO salgan varios carros seguidos de la misma marca. Cada carga baraja
  // (_shuf, fijado una sola vez) y luego, carro a carro, elegimos el siguiente
  // de una marca DISTINTA a la anterior. Estable durante la sesion.
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

  function applyAll() {
    var r = inCategory(CARS);
    if (state.condition === "new") r = r.filter(function (c) { return c.condition === "new"; });
    else r = r.filter(function (c) { return c.condition !== "new"; });
    if (state.category === "vans" && state.vanType) {
      r = r.filter(function (c) { return state.vanType === "work" ? isWorkVan(c) : !isWorkVan(c); });
    }
    if (state.quick === "under-20k") r = r.filter(function (c) { return c.price < 20000 && c.price > 0; });
    else if (state.quick === "under-10k") r = r.filter(function (c) { return c.price < 10000 && c.price > 0; });
    else if (["suv", "sedan", "truck"].indexOf(state.quick) > -1) r = r.filter(function (c) { return c.bodyType === state.quick; });
    if (state.search) { var q = state.search.toLowerCase(); r = r.filter(function (c) { return (c.year + " " + c.make + " " + c.model + " " + c.trim).toLowerCase().indexOf(q) > -1; }); }
    var f = state.filters;
    if (f.make.length) r = r.filter(function (c) { return f.make.indexOf(c.make) > -1; });
    if (f.model.length) r = r.filter(function (c) { return f.model.indexOf(canonModel(c.model)) > -1; });
    if (f.body.length) r = r.filter(function (c) { return f.body.indexOf(c.bodyType) > -1; });
    if (f.priceMin) r = r.filter(function (c) { return c.price >= f.priceMin; });
    if (f.priceMax) r = r.filter(function (c) { return c.price <= f.priceMax; });
    if (f.yearMin) r = r.filter(function (c) { return c.year >= f.yearMin; });
    if (f.yearMax) r = r.filter(function (c) { return c.year <= f.yearMax; });
    if (f.mileageMax) r = r.filter(function (c) { return c.mileage <= f.mileageMax; });
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
    var typeLabel = (c.category && c.category !== "cars") ? PMX.catLabel(c.category) : bodyLabel(c.bodyType);
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
        '<div class="pmx-vcard__price">' + (c.price > 0 ? PMX.money(c.price) : 'Consultar precio') + (save ? '<small>' + PMX.money(c.msrp) + '</small>' : '') + '</div>' +
        '<div class="pmx-vcard__actions">' +
          '<a href="/demo/vehicle/?id=' + encodeURIComponent(c.id) + '" class="pmx-btn pmx-btn--primary">' + PMX.t("btn_details") + '</a>' +
          '<a href="/financing/apply/?vin=' + c.id + '" class="pmx-btn pmx-btn--ghost">' + PMX.t("btn_prequal") + '</a>' +
        '</div>' +
      '</div></article>';
  }

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

  function setCategory(slug) {
    state.category = slug; state.page = 1;
    state.vanType = ""; state.quick = "all"; state.filters.make = []; state.filters.model = [];
    document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (x) { x.classList.remove("active"); });
    ensureConditionFits();
    buildMakeSelect(); buildModelSelect();
    renderCats(); renderVanTypes(); render();
    try {
      var u = new URL(location.href);
      if (slug === DEFAULT_CAT) u.searchParams.delete("cat"); else u.searchParams.set("cat", slug);
      history.replaceState(null, "", u.pathname + (u.search || ""));
    } catch (e) {}
  }

  function buildMakeSelect() {
    var sel = $("#pmxMakeSel"); if (!sel) return;
    var counts = {};
    inCategory(CARS).forEach(function (c) { if (c.make) counts[c.make] = (counts[c.make] || 0) + 1; });
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
    inCategory(CARS).forEach(function (c) {
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

  function renderChips() {
    var chips = [];
    if (state.quick !== "all") chips.push({ k: "quick", v: state.quick, l: PMX.t("qf_" + ({ "under-20k": "20", "under-10k": "10", suv: "suv", sedan: "sedan", truck: "truck" }[state.quick] || "20")) });
    if (state.vanType) chips.push({ k: "vantype", v: state.vanType, l: PMX.t(state.vanType === "work" ? "vt_work" : "vt_pass") });
    if (state.search) chips.push({ k: "search", v: state.search, l: '"' + state.search + '"' });
    state.filters.make.forEach(function (m) { chips.push({ k: "make", v: m, l: m }); });
    state.filters.model.forEach(function (m) { chips.push({ k: "model", v: m, l: m }); });
    state.filters.body.forEach(function (b) { chips.push({ k: "body", v: b, l: bodyLabel(b) }); });
    ["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax"].forEach(function (key) {
      if (state.filters[key]) chips.push({ k: key, v: state.filters[key], l: key + ": " + state.filters[key] });
    });
    var host = $("#pmxChips");
    host.innerHTML = chips.map(function (c) {
      return '<span class="pmx-chip" data-k="' + c.k + '" data-v="' + String(c.v).replace(/"/g, "&quot;") + '">' + c.l + ' ✕</span>';
    }).join("");
    $("#pmxClear").style.display = chips.length ? "inline-flex" : "none";
    var fc = $("#pmxFilterCount"); if (fc) fc.textContent = chips.length || "";
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
      f.priceMin || f.priceMax || f.yearMin || f.yearMax || f.mileageMax;
  }
  function emptyBlock() {
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
    var start = (state.page - 1) * PER, paged = filtered.slice(start, start + PER);
    $("#pmxCount").textContent = total;
    $("#pmxStatCount").textContent = CARS.length;
    var grid = $("#pmxGrid");
    grid.innerHTML = total ? paged.map(card).join("") : emptyBlock();
    var rb = $("#pmxReset"); if (rb) rb.addEventListener("click", reset);
    renderChips(); renderPagination(total);
    if (window.PMX && PMX.reveal) PMX.reveal(grid);
  }

  function checkboxGroup(hostId, type, values) {
    $(hostId).innerHTML = values.map(function (o) {
      var label = type === "body" ? bodyLabel(o.v) : o.v;
      return '<label class="pmx-check"><input type="checkbox" data-ft="' + type + '" value="' + o.v + '"><span>' + label + '</span><span class="pmx-count">' + o.n + '</span></label>';
    }).join("");
  }
  function buildFilters() {
    var bodies = {};
    CARS.forEach(function (c) { if (c.bodyType) bodies[c.bodyType] = (bodies[c.bodyType] || 0) + 1; });
    checkboxGroup("#pmxBody", "body", Object.keys(bodies).sort().map(function (k) { return { v: k, n: bodies[k] }; }));
    document.querySelectorAll('#pmxBody input').forEach(function (inp) {
      inp.addEventListener("change", function () {
        var t = inp.dataset.ft, v = inp.value;
        if (inp.checked) { if (state.filters[t].indexOf(v) < 0) state.filters[t].push(v); }
        else state.filters[t] = state.filters[t].filter(function (x) { return x !== v; });
        state.page = 1; render();
      });
    });
  }

  function reset() {
    state.quick = "all"; state.vanType = ""; state.search = ""; state.sort = "new"; state.page = 1;
    state.condition = "used";
    state.filters = { make: [], model: [], body: [], priceMin: null, priceMax: null, yearMin: null, yearMax: null, mileageMax: null };
    document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (b) { b.classList.remove("active"); });
    ensureConditionFits();
    document.querySelectorAll('.pmx-sidebar input[type=checkbox]').forEach(function (i) { i.checked = false; });
    document.querySelectorAll('.pmx-sidebar input[type=number]').forEach(function (i) { i.value = ""; });
    $("#pmxSearch").value = ""; $("#pmxSort").value = "new";
    buildMakeSelect(); buildModelSelect(); renderVanTypes();
    render();
  }

  function wire() {
    document.querySelectorAll(".pmx-condtab").forEach(function (b) {
      b.addEventListener("click", function () {
        state.condition = b.dataset.cond; state.page = 1;
        syncCondTabs(); render();
      });
    });
    document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.classList.contains("active");
        document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (x) { x.classList.remove("active"); });
        state.quick = on ? "all" : b.dataset.quick;
        if (!on) b.classList.add("active");
        state.page = 1; render();
      });
    });
    document.querySelectorAll("[data-vantype]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.vanType = state.vanType === b.dataset.vantype ? "" : b.dataset.vantype;
        state.page = 1; renderVanTypes(); render();
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
    $("#pmxSort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    [["pmxPriceMin", "priceMin"], ["pmxPriceMax", "priceMax"], ["pmxYearMin", "yearMin"], ["pmxYearMax", "yearMax"], ["pmxMileageMax", "mileageMax"]].forEach(function (p) {
      $("#" + p[0]).addEventListener("change", function (e) { state.filters[p[1]] = e.target.value ? parseInt(e.target.value, 10) : null; state.page = 1; render(); });
    });
    $("#pmxChips").addEventListener("click", function (e) {
      var chip = e.target.closest(".pmx-chip"); if (!chip) return;
      var k = chip.dataset.k, v = chip.dataset.v;
      if (k === "quick") { state.quick = "all"; document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (x) { x.classList.remove("active"); }); }
      else if (k === "vantype") { state.vanType = ""; renderVanTypes(); }
      else if (k === "search") { state.search = ""; $("#pmxSearch").value = ""; }
      else if (k === "make") { state.filters.make = []; state.filters.model = []; buildMakeSelect(); buildModelSelect(); }
      else if (k === "model") { state.filters.model = []; buildModelSelect(); }
      else if (["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax"].indexOf(k) > -1) {
        state.filters[k] = null;
        var map = { priceMin: "pmxPriceMin", priceMax: "pmxPriceMax", yearMin: "pmxYearMin", yearMax: "pmxYearMax", mileageMax: "pmxMileageMax" };
        $("#" + map[k]).value = "";
      } else { state.filters[k] = state.filters[k].filter(function (x) { return x !== v; }); document.querySelectorAll('input[data-ft="' + k + '"][value="' + v + '"]').forEach(function (i) { i.checked = false; }); }
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

    var cats = $("#pmxCats");
    if (cats) cats.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return;
      setCategory(b.dataset.cat);
    });

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

    window.addEventListener("pmx-lang", function () { renderCats(); buildMakeSelect(); buildModelSelect(); render(); });
  }

  PMX.loadInventory().then(function (cars) {
    CARS = cars;
    CARS.forEach(function (c) { c._shuf = Math.random(); });
    if (!CARS.length) {
      $("#pmxGrid").innerHTML = '<div class="pmx-empty"><h3>' + PMX.t("inv_none_t") + '</h3><p>' + PMX.t("inv_none_s") + '</p><a class="pmx-btn pmx-btn--primary" href="/contact/">' + PMX.t("inv_none_cta") + '</a></div>';
      [".pmx-toolbar", ".pmx-results__bar", "#pmxSidebar"].forEach(function (s) { var el = document.querySelector(s); if (el) el.style.display = "none"; });
      var main = document.querySelector(".pmx-invmain"); if (main) main.style.display = "block";
      var stat = $("#pmxStatCount"); if (stat) stat.textContent = "0";
      return;
    }
    buildFilters();
    var url = new URLSearchParams(location.search);
    var cat = url.get("cat");
    if (cat && (PMX.categories ? PMX.categories() : []).some(function (c) { return c.slug === cat; })) {
      state.category = cat;
    }
    if (url.get("filter")) {
      state.quick = url.get("filter");
      document.querySelectorAll(".pmx-qf[data-quick]").forEach(function (b) { b.classList.toggle("active", b.dataset.quick === state.quick); });
    }
    var cond = url.get("cond");
    if (cond === "new" || cond === "used") state.condition = cond;
    ensureConditionFits();
    buildMakeSelect(); buildModelSelect();
    wire(); renderCats(); renderVanTypes(); render();
  });
})();
