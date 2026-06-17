/* =====================================================================
   PROMAX — Inventario interactivo (filtros, orden, paginación)
   ===================================================================== */
(function () {
  "use strict";

  PMX.addTranslations({
    es: {
      inv_eyebrow: "Vehículos disponibles", inv_title: "Encuentra tu vehículo ideal",
      inv_sub: "Vehículos seleccionados, precios honestos, financiamiento flexible",
      inv_available: "Disponibles", inv_rating: "Calificación", inv_sold: "Vendidos",
      qf_all: "Todos", qf_20: "Bajo $20k", qf_10: "Bajo $10k", qf_suv: "SUVs", qf_sedan: "Sedanes", qf_truck: "Camionetas",
      inv_search_ph: "Buscar por marca, modelo, año...",
      sort_new: "Más recientes", sort_pa: "Precio: menor a mayor", sort_pd: "Precio: mayor a menor",
      sort_ma: "Millaje: menor a mayor", sort_yd: "Año: nuevo a viejo",
      inv_filters: "Filtros", inv_refine: "Refinar búsqueda", inv_clear: "Limpiar filtros",
      f_make: "Marca", f_body: "Carrocería", f_price: "Precio", f_year: "Año", f_mileage: "Millaje",
      ph_min: "Mín", ph_max: "Máx", ph_from: "Desde", ph_to: "Hasta", ph_maxmi: "Millas máx",
      inv_match: "vehículos", inv_help: "¿Necesitas ayuda? Escríbenos",
      inv_empty_t: "Sin resultados", inv_empty_s: "Ajusta los filtros o explora todo el inventario", inv_reset: "Reiniciar",
      inv_err_t: "No se pudo cargar el inventario", inv_err_s: "Recarga la página o intenta más tarde.",
      btn_details: "Ver Detalles", btn_prequal: "Pre-Calificar", prev: "Anterior", next: "Siguiente",
      body_suv: "SUV", body_sedan: "SEDÁN", body_truck: "CAMIONETA", body_coupe: "COUPÉ",
    },
    en: {
      inv_eyebrow: "Available vehicles", inv_title: "Find your perfect ride",
      inv_sub: "Hand-picked vehicles, honest pricing, flexible financing",
      inv_available: "Available", inv_rating: "Rating", inv_sold: "Sold",
      qf_all: "All", qf_20: "Under $20k", qf_10: "Under $10k", qf_suv: "SUVs", qf_sedan: "Sedans", qf_truck: "Trucks",
      inv_search_ph: "Search by make, model, year...",
      sort_new: "Newest", sort_pa: "Price: low to high", sort_pd: "Price: high to low",
      sort_ma: "Mileage: low to high", sort_yd: "Year: new to old",
      inv_filters: "Filters", inv_refine: "Refine search", inv_clear: "Clear filters",
      f_make: "Make", f_body: "Body type", f_price: "Price", f_year: "Year", f_mileage: "Mileage",
      ph_min: "Min", ph_max: "Max", ph_from: "From", ph_to: "To", ph_maxmi: "Max miles",
      inv_match: "vehicles", inv_help: "Need help? Contact us",
      inv_empty_t: "No results", inv_empty_s: "Adjust filters or browse all inventory", inv_reset: "Reset",
      inv_err_t: "Unable to load inventory", inv_err_s: "Refresh the page or try later.",
      btn_details: "View Details", btn_prequal: "Pre-Qualify", prev: "Prev", next: "Next",
      body_suv: "SUV", body_sedan: "SEDAN", body_truck: "TRUCK", body_coupe: "COUPE",
    },
  });

  var PER = 9, CARS = [], $ = function (s, r) { return (r || document).querySelector(s); };
  var state = { quick: "all", search: "", sort: "new", page: 1,
    filters: { make: [], body: [], priceMin: null, priceMax: null, yearMin: null, yearMax: null, mileageMax: null } };

  function bodyLabel(b) { return PMX.t("body_" + b) || b.toUpperCase(); }

  function applyAll() {
    var r = CARS.slice();
    if (state.quick === "under-20k") r = r.filter(function (c) { return c.price < 20000; });
    else if (state.quick === "under-10k") r = r.filter(function (c) { return c.price < 10000; });
    else if (["suv", "sedan", "truck"].indexOf(state.quick) > -1) r = r.filter(function (c) { return c.bodyType === state.quick; });
    if (state.search) { var q = state.search.toLowerCase(); r = r.filter(function (c) { return (c.year + " " + c.make + " " + c.model + " " + c.trim).toLowerCase().indexOf(q) > -1; }); }
    var f = state.filters;
    if (f.make.length) r = r.filter(function (c) { return f.make.indexOf(c.make) > -1; });
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
      default: r.sort(function (a, b) { return b.year - a.year; });
    }
    return r;
  }

  function card(c) {
    var save = c.msrp && c.msrp > c.price ? c.msrp - c.price : 0;
    return '<article class="pmx-vcard">' +
      '<a href="/vehicle/?id=' + c.id + '" style="text-decoration:none;color:inherit;display:contents">' +
      '<div class="pmx-vcard__img" style="background-image:url(\'' + c.image + '\')">' +
        (c.badge ? '<span class="pmx-vcard__badge">' + c.badge + '</span>' : '') +
        '<span class="pmx-vcard__type">' + bodyLabel(c.bodyType) + '</span>' +
      '</div></a>' +
      '<div class="pmx-vcard__body">' +
        '<h3 class="pmx-vcard__title">' + c.year + ' ' + c.make + ' ' + c.model + (c.trim ? ' ' + c.trim : '') + '</h3>' +
        '<div class="pmx-vcard__specs"><span>' + PMX.num(c.mileage) + ' mi</span><span>' + c.fuel + '</span><span>' + c.drivetrain + '</span></div>' +
        '<div class="pmx-vcard__price">' + PMX.money(c.price) + (save ? '<small>' + PMX.money(c.msrp) + '</small>' : '') + '</div>' +
        '<div class="pmx-vcard__actions">' +
          '<a href="/vehicle/?id=' + c.id + '" class="pmx-btn pmx-btn--primary">' + PMX.t("btn_details") + '</a>' +
          '<a href="/financing/apply/?vin=' + c.id + '" class="pmx-btn pmx-btn--ghost">' + PMX.t("btn_prequal") + '</a>' +
        '</div>' +
      '</div></article>';
  }

  function renderChips() {
    var chips = [];
    if (state.quick !== "all") chips.push({ k: "quick", v: state.quick, l: PMX.t("qf_" + ({ "under-20k": "20", "under-10k": "10", suv: "suv", sedan: "sedan", truck: "truck" }[state.quick] || "all")) });
    if (state.search) chips.push({ k: "search", v: state.search, l: '"' + state.search + '"' });
    state.filters.make.forEach(function (m) { chips.push({ k: "make", v: m, l: m }); });
    state.filters.body.forEach(function (b) { chips.push({ k: "body", v: b, l: bodyLabel(b) }); });
    ["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax"].forEach(function (key) {
      if (state.filters[key]) chips.push({ k: key, v: state.filters[key], l: key + ": " + state.filters[key] });
    });
    var host = $("#pmxChips");
    host.innerHTML = chips.map(function (c) {
      return '<span class="pmx-chip" data-k="' + c.k + '" data-v="' + c.v + '">' + c.l + ' ✕</span>';
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

  function render() {
    var filtered = applyAll(), total = filtered.length;
    var start = (state.page - 1) * PER, paged = filtered.slice(start, start + PER);
    $("#pmxCount").textContent = total;
    $("#pmxStatCount").textContent = CARS.length;
    var grid = $("#pmxGrid");
    grid.innerHTML = total ? paged.map(card).join("")
      : '<div class="pmx-empty"><h3>' + PMX.t("inv_empty_t") + '</h3><p>' + PMX.t("inv_empty_s") + '</p><button class="pmx-btn pmx-btn--primary" id="pmxReset">' + PMX.t("inv_reset") + '</button></div>';
    var rb = $("#pmxReset"); if (rb) rb.addEventListener("click", reset);
    renderChips(); renderPagination(total);
  }

  function checkboxGroup(hostId, type, values) {
    $(hostId).innerHTML = values.map(function (o) {
      var label = type === "body" ? bodyLabel(o.v) : o.v;
      return '<label class="pmx-check"><input type="checkbox" data-ft="' + type + '" value="' + o.v + '"><span>' + label + '</span><span class="pmx-count">' + o.n + '</span></label>';
    }).join("");
  }
  function buildFilters() {
    var makes = {}, bodies = {};
    CARS.forEach(function (c) { if (c.make) makes[c.make] = (makes[c.make] || 0) + 1; bodies[c.bodyType] = (bodies[c.bodyType] || 0) + 1; });
    checkboxGroup("#pmxMake", "make", Object.keys(makes).sort().map(function (k) { return { v: k, n: makes[k] }; }));
    checkboxGroup("#pmxBody", "body", Object.keys(bodies).sort().map(function (k) { return { v: k, n: bodies[k] }; }));
    document.querySelectorAll('#pmxMake input, #pmxBody input').forEach(function (inp) {
      inp.addEventListener("change", function () {
        var t = inp.dataset.ft, v = inp.value;
        if (inp.checked) { if (state.filters[t].indexOf(v) < 0) state.filters[t].push(v); }
        else state.filters[t] = state.filters[t].filter(function (x) { return x !== v; });
        state.page = 1; render();
      });
    });
  }

  function reset() {
    state = { quick: "all", search: "", sort: "new", page: 1, filters: { make: [], body: [], priceMin: null, priceMax: null, yearMin: null, yearMax: null, mileageMax: null } };
    document.querySelectorAll(".pmx-qf").forEach(function (b) { b.classList.toggle("active", b.dataset.quick === "all"); });
    document.querySelectorAll('.pmx-sidebar input[type=checkbox]').forEach(function (i) { i.checked = false; });
    document.querySelectorAll('.pmx-sidebar input[type=number]').forEach(function (i) { i.value = ""; });
    $("#pmxSearch").value = ""; $("#pmxSort").value = "new";
    render();
  }

  function wire() {
    document.querySelectorAll(".pmx-qf").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".pmx-qf").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); state.quick = b.dataset.quick; state.page = 1; render();
      });
    });
    var s = $("#pmxSearch"); s.addEventListener("input", function () { state.search = s.value.trim(); state.page = 1; render(); });
    $("#pmxSort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    [["pmxPriceMin", "priceMin"], ["pmxPriceMax", "priceMax"], ["pmxYearMin", "yearMin"], ["pmxYearMax", "yearMax"], ["pmxMileageMax", "mileageMax"]].forEach(function (p) {
      $("#" + p[0]).addEventListener("change", function (e) { state.filters[p[1]] = e.target.value ? parseInt(e.target.value, 10) : null; state.page = 1; render(); });
    });
    $("#pmxChips").addEventListener("click", function (e) {
      var chip = e.target.closest(".pmx-chip"); if (!chip) return;
      var k = chip.dataset.k, v = chip.dataset.v;
      if (k === "quick") { state.quick = "all"; document.querySelectorAll(".pmx-qf").forEach(function (x) { x.classList.toggle("active", x.dataset.quick === "all"); }); }
      else if (k === "search") { state.search = ""; $("#pmxSearch").value = ""; }
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
  }

  PMX.loadInventory().then(function (cars) {
    CARS = cars;
    if (!CARS.length) { $("#pmxGrid").innerHTML = '<div class="pmx-empty"><h3>' + PMX.t("inv_err_t") + '</h3><p>' + PMX.t("inv_err_s") + '</p></div>'; return; }
    buildFilters();
    var url = new URLSearchParams(location.search);
    if (url.get("filter")) {
      state.quick = url.get("filter");
      document.querySelectorAll(".pmx-qf").forEach(function (b) { b.classList.toggle("active", b.dataset.quick === state.quick); });
    }
    wire(); render();
  });
})();
