/* =====================================================================
   PROMAX AUTO BROKER — MOTOR DE ANIMACIONES AL SCROLL (anim.js)
   GSAP + ScrollTrigger. Implementa:
     1) Entrada y SALIDA continuas (se repite al subir/bajar el scroll)
        -> toggleActions: "play reverse play reverse"
     2) Text reveal palabra por palabra con máscara (overflow:hidden)
     3) Efecto cascada (stagger) en grids
     4) Parallax (scrub) en imágenes de fondo y elementos decorativos
   Degrada con elegancia: respeta prefers-reduced-motion y, si GSAP no
   carga, NUNCA deja contenido oculto.
   Atributos en el HTML:
     data-anim="text"      -> titular que se revela palabra por palabra
     data-anim="up"        -> aparece desde abajo (fade + subida)
     data-anim="stagger"   -> sus hijos directos entran en cadena
     data-anim-defer       -> el stagger se activa luego (contenido async)
     data-anim-delay="0.1" -> retraso extra (segundos) en un data-anim="up"
     data-parallax="-26"   -> desplazamiento vertical (% del alto) en scroll
     data-parallax-scale="1.06" -> zoom suave en scroll
     data-parallax-root    -> elemento usado como disparador del parallax
     data-anim-root        -> marca una sección gestionada por GSAP
                              (site.js la excluye de su reveal antiguo)
   ===================================================================== */
(function () {
  "use strict";

  /* ---- API pública con cola: disponible aunque GSAP aún no haya iniciado ---- */
  var impl = null, queue = [];
  function flush() {
    if (!impl) return;
    while (queue.length) {
      var job = queue.shift();
      if (job[0] === "cards") impl.cards(job[1]);
      else if (job[0] === "refresh") impl.refresh();
    }
  }
  window.PMXAnim = {
    cards: function (sel) { queue.push(["cards", sel]); flush(); },
    refresh: function () { queue.push(["refresh"]); flush(); }
  };

  var RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var DESKTOP = !!(window.matchMedia && window.matchMedia("(min-width: 769px)").matches);

  function reveal() { document.documentElement.classList.remove("pmx-ganim"); }

  // Si el usuario pide menos movimiento: no animamos y mostramos todo.
  if (RM) { reveal(); return; }

  function start() {
    var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    // Si el CDN de GSAP falló: revelar todo y salir (nada queda oculto).
    if (!gsap || !ScrollTrigger) { reveal(); return; }
    gsap.registerPlugin(ScrollTrigger);

    var EASE = "power3.out";
    var TOGGLE = "play reverse play reverse"; // entra y sale; se repite al volver

    /* -------- 1) TEXT REVEAL palabra por palabra (con máscara) -------- */
    function splitWords(el) {
      var text = (el.textContent || "").trim();
      el.innerHTML = "";
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (chunk) {
        if (chunk === "") return;
        if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(" ")); return; }
        var mask = document.createElement("span");
        mask.className = "pmx-aw";
        var inner = document.createElement("span");
        inner.className = "pmx-aw__i";
        inner.textContent = chunk;
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
      el.appendChild(frag);
      return el.querySelectorAll(".pmx-aw__i");
    }
    var textTriggers = [];
    function buildText(el) {
      var words = splitWords(el);
      gsap.set(el, { opacity: 1 });
      gsap.set(words, { yPercent: 120 });
      var tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 88%", end: "bottom 12%", toggleActions: TOGGLE }
      });
      tl.to(words, { yPercent: 0, duration: 0.7, ease: EASE, stagger: 0.06 });
      if (tl.scrollTrigger) textTriggers.push(tl.scrollTrigger);
    }
    function wireText(root) {
      (root || document).querySelectorAll('[data-anim="text"]').forEach(buildText);
    }
    function rebuildText() {
      textTriggers.forEach(function (st) { if (st) st.kill(); });
      textTriggers = [];
      wireText(document);
      ScrollTrigger.refresh();
    }

    /* -------- 2) FADE-UP genérico (entra y sale) -------- */
    function wireFade(root) {
      (root || document).querySelectorAll('[data-anim="up"]').forEach(function (el) {
        var delay = parseFloat(el.getAttribute("data-anim-delay")) || 0;
        gsap.set(el, { opacity: 0, y: 42 });
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.8, ease: EASE, delay: delay,
          scrollTrigger: { trigger: el, start: "top 86%", end: "bottom 10%", toggleActions: TOGGLE }
        });
      });
    }

    /* -------- 3) STAGGER en cadena para grids -------- */
    function staggerGrid(grid) {
      var items = grid.querySelectorAll(":scope > *");
      if (!items.length) return;
      // Si se pide, dispara desde la sección contenedora (útil para grupos sobre
      // la línea de flotación, como los CTA del hero: así entran al cargar).
      var useRoot = grid.hasAttribute("data-anim-trigger-root");
      var trig = useRoot ? (grid.closest("[data-anim-root]") || grid) : grid;
      gsap.set(items, { opacity: 0, y: 60 });
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.12,
        scrollTrigger: { trigger: trig, start: useRoot ? "top 80%" : "top 85%", end: "bottom 6%", toggleActions: TOGGLE }
      });
    }
    function wireStaggers(root) {
      (root || document).querySelectorAll('[data-anim="stagger"]:not([data-anim-defer])').forEach(staggerGrid);
    }

    /* -------- 4) PARALLAX (scrub) — solo escritorio para evitar jank móvil -------- */
    function wireParallax(root) {
      if (!DESKTOP) return;
      root = root || document;
      root.querySelectorAll("[data-parallax]").forEach(function (el) {
        var amt = parseFloat(el.getAttribute("data-parallax"));
        if (isNaN(amt)) amt = 15;
        gsap.to(el, {
          yPercent: amt, ease: "none",
          scrollTrigger: {
            trigger: el.closest("[data-parallax-root]") || el,
            start: "top bottom", end: "bottom top", scrub: true
          }
        });
      });
      root.querySelectorAll("[data-parallax-scale]").forEach(function (el) {
        var to = parseFloat(el.getAttribute("data-parallax-scale")) || 1.06;
        gsap.fromTo(el, { scale: 1 }, {
          scale: to, ease: "none",
          scrollTrigger: {
            trigger: el.closest("[data-parallax-root]") || el,
            start: "top top", end: "bottom top", scrub: true
          }
        });
      });
    }

    // Cableado inicial
    wireText(document);
    wireFade(document);
    wireStaggers(document);
    wireParallax(document);
    reveal(); // quitamos el guard: a partir de aquí GSAP controla la opacidad inline

    impl = {
      cards: function (sel) {
        var g = (typeof sel === "string") ? document.querySelector(sel) : sel;
        if (g) { staggerGrid(g); ScrollTrigger.refresh(); }
      },
      refresh: function () { ScrollTrigger.refresh(); }
    };
    flush();

    // Recalcular posiciones cuando terminen de cargar las imágenes
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    // Re-split de titulares tras cambiar idioma (applyI18n corre justo después
    // del evento 'pmx-lang', por eso diferimos dos frames).
    window.addEventListener("pmx-lang", function () {
      requestAnimationFrame(function () { requestAnimationFrame(rebuildText); });
    });
  }

  // site.js aplica i18n dentro de su mount() (en DOMContentLoaded). Como este
  // script se carga DESPUÉS de site.js, su listener corre después: el texto ya
  // está traducido cuando lo partimos en palabras.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
