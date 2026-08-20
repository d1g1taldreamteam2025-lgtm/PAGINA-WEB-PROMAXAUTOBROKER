/* =====================================================================
   PROMAX ADMIN — COMPUERTA DE SESIÓN (se carga SÍNCRONA en el <head>)
   ---------------------------------------------------------------------
   Problema que resuelve: el formulario de login estaba visible por defecto
   y la sesión se validaba DESPUÉS (async) → el usuario ya logueado veía el
   login parpadear ~1s y luego "entraba solo". Horrible.

   Qué hace: ANTES del primer pintado lee (síncrono, sin red) si hay un token
   de sesión de Supabase guardado (localStorage: sb-*-auth-token).
     · Si HAY token  → clase html.pmx-hassession: el CSS oculta el login y
       muestra el splash oscuro "Cargando tu panel…". checkAuth() valida por
       detrás y revela el panel (gateReveal) o, si el token estaba vencido,
       vuelve a mostrar el login (gateFail). El login NUNCA parpadea.
     · Si NO hay token → todo igual que siempre: login al instante.
   ===================================================================== */
(function () {
  var has = false;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      if (/^sb-.*-auth-token$/.test(localStorage.key(i) || "")) { has = true; break; }
    }
  } catch (e) {}
  if (has) document.documentElement.classList.add("pmx-hassession");
})();
// El panel llama a estas dos cuando ya sabe la verdad:
function gateReveal() { document.documentElement.classList.add("pmx-ready"); }      // sesión válida → fuera splash
function gateFail()  { document.documentElement.classList.remove("pmx-hassession"); } // token vencido/logout → login normal
