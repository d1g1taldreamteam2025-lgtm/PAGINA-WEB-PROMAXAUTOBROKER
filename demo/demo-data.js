(function () {
  var cache = null;
  function load() {
    if (cache) return cache;
    cache = fetch("/demo/toyota.json")
      .then(function (r) { return r.json(); })
      .then(function (rows) { return rows.map(PMX.normalizeVehicle); });
    return cache;
  }
  PMX.loadInventory = load;
  PMX.loadVehicle = function (id) {
    return load().then(function (all) {
      return all.filter(function (c) { return c.id === id; })[0] || null;
    });
  };
  PMX.loadSimilar = function (cat, excludeId, n) {
    return load().then(function (all) {
      return all.filter(function (c) { return c.id !== excludeId && c.category === cat; }).slice(0, n || 6);
    });
  };
})();
