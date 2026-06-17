/* =====================================================================
   PROMAX AUTO BROKER — CONFIGURACIÓN CENTRAL (ÚNICA FUENTE DE VERDAD)
   ---------------------------------------------------------------------
   Cambia los datos de la marca SOLO en este archivo y se actualizan
   en toda la web (header, footer, formularios, WhatsApp, redes, etc.).

   Los valores marcados con  // <-- CONFIRMAR  son provisionales y deben
   ser validados por el cliente (ver /docs/PREGUNTAS-CLIENTE.md).
   ===================================================================== */

window.PROMAX = {

  /* ---------- IDENTIDAD DE MARCA ---------- */
  brand: {
    name: "Promax Auto Broker",
    short: "Promax",
    // Logo: coloca el archivo real en /assets/img/logo.svg (o .png)
    logo: "/assets/img/logo.svg",
    logoLight: "/assets/img/logo-white.svg", // versión para fondos oscuros (footer)
    // Texto de respaldo que se muestra si aún no hay logo cargado
    logoText: "PROMAX",
  },

  /* ---------- CONTACTO ---------- */
  contact: {
    phone:        "(000) 000-0000",                 // <-- CONFIRMAR
    phoneRaw:     "10000000000",                     // <-- CONFIRMAR (solo dígitos, con código país)
    whatsapp:     "10000000000",                     // <-- CONFIRMAR (número de WhatsApp con código país)
    email:        "info@promaxautobroker.com",       // <-- CONFIRMAR
    address:      "Dirección por confirmar",          // <-- CONFIRMAR
    addressMaps:  "https://maps.google.com/?q=Promax+Auto+Broker", // <-- CONFIRMAR
    hoursShort:   "Lun–Sáb 9AM–7PM · Dom 11AM–5PM",  // <-- CONFIRMAR
    hours: [
      { day: "mon", time: "9:00am – 7:00pm" },
      { day: "tue", time: "9:00am – 7:00pm" },
      { day: "wed", time: "9:00am – 7:00pm" },
      { day: "thu", time: "9:00am – 7:00pm" },
      { day: "fri", time: "9:00am – 7:00pm" },
      { day: "sat", time: "9:00am – 7:00pm" },
      { day: "sun", time: "11:00am – 5:00pm" },
    ],
    // Coordenadas para el mapa (OpenStreetMap). Por confirmar.
    geo: { lat: 25.7617, lng: -80.1918 },            // <-- CONFIRMAR (ejemplo: Miami)
  },

  /* ---------- REDES SOCIALES (confirmadas por el cliente) ---------- */
  social: {
    instagram: "https://www.instagram.com/promaxautobroker/",
    facebook:  "https://www.facebook.com/104409542167703",
    youtube:   "https://www.youtube.com/@Promaxautobroker/community",
    tiktok:    "https://www.tiktok.com/@promaxautobroker",
  },

  /* ---------- INTEGRACIONES / BACKEND ---------- */
  endpoints: {
    // Webhook donde llegan los leads (financiamiento, contacto, newsletter).
    // Usa tu n8n / CRM. Déjalo vacío ("") para solo simular el envío.
    leadsWebhook: "",                                // <-- CONFIRMAR

    // Fuente del inventario:
    //  - "json"  => lee /assets/data/inventory.json (sin backend, fácil de editar)
    //  - "api"   => lee de inventoryApiUrl (Supabase/REST)
    inventorySource: "json",
    inventoryApiUrl: "",                             // opcional si usas "api"
    inventoryApiKey: "",                             // opcional si usas "api"

    // Google Apps Script Web App para la sección REFERIDOS -> Google Sheet.
    // (Ver /google-apps-script/Code.gs y el README para desplegarlo.)
    referralsScriptUrl: "",                          // <-- CONFIRMAR (URL del Web App)
    referralsToken: "promax-2026",                   // <-- debe COINCIDIR con TOKEN en Code.gs
  },

  /* ---------- REFERIDOS / SORTEO ---------- */
  referrals: {
    goal: 100,            // ventas necesarias para activar el sorteo
    soldStatus: "Vendido",// estado que cuenta como venta para el sorteo
    raffleEnabled: true,
    // Clave de acceso a la página interna /referrals/ (vacío = sin clave).
    // No es seguridad fuerte, solo evita accesos casuales.
    passcode: "promax",   // <-- CONFIRMAR
  },

  /* ---------- IDIOMA ---------- */
  i18n: {
    default: "es",        // "es" | "en"
    available: ["es", "en"],
  },

  /* ---------- BARRA SUPERIOR (marquee) ---------- */
  marquee: {
    es: ["+500 Clientes Satisfechos", "Bajo Pago Inicial", "Aprobación Rápida", "Aceptamos ITIN", "Atención Personalizada"],
    en: ["+500 Happy Clients", "Low Down Payment", "Fast Approval", "ITIN Accepted", "Personalized Service"],
  },
};
