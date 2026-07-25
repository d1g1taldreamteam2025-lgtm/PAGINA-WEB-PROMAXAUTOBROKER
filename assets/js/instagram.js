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
      thumb: it.thumbnail_url || it.media_url || it.thumbnail || it.image || it.poster || "",
      video: it.video || it.video_url || it.mp4 || "",
      caption: it.caption || it.text || ""
    };
  }

  // De un enlace de reel saca la URL de incrustación de Instagram.
  function embedURL(permalink) {
    var m = String(permalink || "").match(/instagram\.com\/(?:p|reel|tv)\/([^\/?#]+)/i);
    return m ? "https://www.instagram.com/p/" + m[1] + "/embed/" : "";
  }

  function card(c, idx) {
    var media = c.video
      ? '<video class="pmx-ig__video" muted loop playsinline preload="metadata"' + (c.thumb ? ' poster="' + c.thumb + '"' : "") + '><source src="' + c.video + '" type="video/mp4"></video>'
      : (c.thumb ? '<div class="pmx-ig__media" style="background-image:url(\'' + c.thumb + '\')"></div>' : "");
    var cap = c.caption ? '<div class="pmx-ig__cap">' + esc(trunc(c.caption, 84)) + "</div>" : "";
    var noimg = (c.thumb || c.video) ? "" : " pmx-ig__card--noimg";
    return '<a class="pmx-ig__card' + noimg + '" href="' + c.permalink + '" target="_blank" rel="noopener" data-idx="' + idx + '">' +
      media + '<div class="pmx-ig__shade"></div>' +
      '<span class="pmx-ig__play">' + PLAY + "</span>" +
      '<span class="pmx-ig__badge">' + IG + "</span>" + cap + "</a>";
  }

  // ---- Reproductor (lightbox) para ver el reel sin salir de la web ----
  var LB = null, STATE = [];
  function buildLightbox() {
    if (LB) return;
    LB = document.createElement("div");
    LB.className = "pmx-iglb";
    LB.innerHTML = '<div class="pmx-iglb__box"></div>';
    document.body.appendChild(LB);
    LB.addEventListener("click", function (e) {
      if (e.target === LB || (e.target.closest && e.target.closest(".pmx-iglb__close"))) closeLB();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLB(); });
  }
  function openLB(item) {
    if (!item) return;
    buildLightbox();
    var box = LB.querySelector(".pmx-iglb__box");
    var close = '<button class="pmx-iglb__close" type="button" aria-label="Cerrar">&times;</button>';
    if (item.video) {
      LB.className = "pmx-iglb pmx-iglb--video is-open";
      box.innerHTML = close + '<video src="' + item.video + '" controls autoplay playsinline' + (item.thumb ? ' poster="' + item.thumb + '"' : "") + "></video>";
    } else {
      var u = embedURL(item.permalink);
      if (!u) { window.open(item.permalink, "_blank", "noopener"); return; }
      LB.className = "pmx-iglb pmx-iglb--embed is-open";
      box.innerHTML = close +
        '<iframe src="' + u + '" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen scrolling="no"></iframe>' +
        '<a class="pmx-iglb__open" href="' + item.permalink + '" target="_blank" rel="noopener">Ver en Instagram ↗</a>';
    }
    document.body.style.overflow = "hidden";
  }
  function closeLB() {
    if (!LB) return;
    LB.className = "pmx-iglb";
    LB.querySelector(".pmx-iglb__box").innerHTML = "";
    document.body.style.overflow = "";
  }

  function render(items) {
    var host = document.querySelector(GRID);
    // Sin videos (el CDN kcixfvoq murio en jul 2026): se oculta la seccion entera
    // en vez de mostrar tarjetas rotas. Al reponer videos en instagram.json vuelve sola.
    if (!items || !items.length) { var sec = host && host.closest("section"); if (sec) sec.style.display = "none"; return; }
    var limit = parseInt(host.getAttribute("data-limit"), 10) || 15;
    STATE = (items || []).map(norm).slice(0, limit);
    host.innerHTML = STATE.length ? STATE.map(function (c, i) { return card(c, i); }).join("")
      : '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px">' + PMX.t("ig_empty") + "</p>";
    var f = document.getElementById("pmxIGFollow");
    if (f && CFG.social) f.setAttribute("href", CFG.social.instagram || "#");

    // Clic en la tarjeta -> abre el reproductor dentro de la web.
    if (!host.__pmxBound) {
      host.__pmxBound = true;
      host.addEventListener("click", function (e) {
        var a = e.target.closest(".pmx-ig__card");
        if (!a) return;
        e.preventDefault();
        openLB(STATE[+a.getAttribute("data-idx")]);
      });
    }
    // Vista previa al pasar el mouse (solo si el reel tiene video propio cargado).
    host.querySelectorAll(".pmx-ig__card").forEach(function (a) {
      var v = a.querySelector("video.pmx-ig__video");
      if (!v) return;
      a.addEventListener("mouseenter", function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
      a.addEventListener("mouseleave", function () { v.pause(); try { v.currentTime = 0; } catch (_) {} });
    });
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
