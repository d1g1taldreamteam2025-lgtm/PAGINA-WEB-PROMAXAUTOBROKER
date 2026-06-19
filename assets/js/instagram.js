/* =====================================================================
   PROMAX — Galería de Instagram (Nosotros)
   Fuente: config.endpoints.instagramFeed (auto) o /assets/data/instagram.json
   Cada tarjeta enlaza al reel (permalink) y abre en Instagram.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.PROMAX || {};
  var GRID = "#pmxIGGrid";
  if (!document.querySelector(GRID)) return;

  PMX.addTranslations({
    es: { ig_eyebrow: "@promaxautobroker", ig_title: "Lo más reciente en Instagram",
      ig_sub: "Mira nuestros últimos vehículos y promociones. Toca para ver el reel.",
      ig_follow: "Seguir en Instagram", ig_loading: "Cargando publicaciones…",
      ig_empty: "Síguenos en Instagram para ver lo más reciente." },
    en: { ig_eyebrow: "@promaxautobroker", ig_title: "Latest on Instagram",
      ig_sub: "See our newest vehicles and promos. Tap to watch the reel.",
      ig_follow: "Follow on Instagram", ig_loading: "Loading posts…",
      ig_empty: "Follow us on Instagram to see the latest." }
  });

  var IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function trunc(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; }

  function norm(it) {
    return {
      permalink: it.permalink || it.link || (CFG.social && CFG.social.instagram) || "#",
      thumb: it.thumbnail_url || it.media_url || it.thumbnail || it.image || "",
      type: String(it.media_type || it.type || "").toUpperCase(),
      caption: it.caption || it.text || ""
    };
  }

  function card(c) {
    var media = c.thumb ? '<div class="pmx-ig__media" style="background-image:url(\'' + c.thumb + '\')"></div>' : "";
    var cap = c.caption ? '<div class="pmx-ig__cap">' + esc(trunc(c.caption, 84)) + "</div>" : "";
    return '<a class="pmx-ig__card' + (c.thumb ? "" : " pmx-ig__card--noimg") + '" href="' + c.permalink + '" target="_blank" rel="noopener">' +
      media + '<div class="pmx-ig__shade"></div>' +
      '<span class="pmx-ig__play">' + PLAY + "</span>" +
      '<span class="pmx-ig__badge">' + IG + "</span>" + cap + "</a>";
  }

  function render(items) {
    var host = document.querySelector(GRID);
    var list = (items || []).map(norm).slice(0, 15);
    host.innerHTML = list.length ? list.map(card).join("")
      : '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px">' + PMX.t("ig_empty") + "</p>";
    var f = document.getElementById("pmxIGFollow");
    if (f && CFG.social) f.setAttribute("href", CFG.social.instagram || "#");
  }

  function load() {
    var url = (CFG.endpoints && CFG.endpoints.instagramFeed) || "";
    var live = url ? fetch(url).then(function (r) { return r.ok ? r.json() : null; }) : Promise.reject();
    live.then(function (d) {
      if (!d) throw 0;
      var arr = Array.isArray(d) ? d : (d.data || d.items || d.media || []);
      if (!arr.length) throw 0;
      render(arr);
    }).catch(function () {
      fetch("/assets/data/instagram.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; })
        .then(render).catch(function () { render([]); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
