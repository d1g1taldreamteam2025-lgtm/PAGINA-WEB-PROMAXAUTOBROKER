/* =====================================================================
   PROMAX — Referidos (cliente). Habla con el Google Apps Script vía JSONP.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.PROMAX || {};
  var EP = CFG.endpoints || {};
  var REF = CFG.referrals || {};

  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      var url = EP.referralsScriptUrl;
      if (!url) { reject(new Error("no-url")); return; }
      var cb = "pmxcb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
      params = params || {};
      params.callback = cb;
      params.token = EP.referralsToken || "";
      var qs = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      var s = document.createElement("script");
      var timer = setTimeout(function () { cleanup(); reject(new Error("timeout")); }, 15000);
      function cleanup() { try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); clearTimeout(timer); }
      window[cb] = function (data) { cleanup(); resolve(data); };
      s.onerror = function () { cleanup(); reject(new Error("network")); };
      s.src = url + (url.indexOf("?") > -1 ? "&" : "?") + qs;
      document.body.appendChild(s);
    });
  }

  window.PMXRef = {
    configured: function () { return !!EP.referralsScriptUrl; },
    count: function () { return jsonp({ action: "count" }); },
    add: function (data) { data.action = "add"; return jsonp(data); },
    list: function (limit) { return jsonp({ action: "list", limit: limit || 10 }); },
    raffle: function () { return jsonp({ action: "raffle" }); },
    goal: REF.goal || 100,
  };
})();
