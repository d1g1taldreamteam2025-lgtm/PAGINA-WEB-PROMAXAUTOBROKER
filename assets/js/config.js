/* =====================================================================
   PROMAX AUTO BROKER — CONFIGURACIÓN CENTRAL (ÚNICA FUENTE DE VERDAD)
   ---------------------------------------------------------------------
   Cambia los datos de la marca SOLO en este archivo y se actualizan
   en toda la web (header, footer, formularios, WhatsApp, redes, etc.).
   ===================================================================== */

window.PROMAX = {

  /* ---------- IDENTIDAD DE MARCA ---------- */
  brand: {
    name: "Promax Auto Broker",
    short: "Promax",
    // Logo oficial (SVG en Cloudinary). El header es oscuro, por eso usamos el mismo en ambos.
    logo: "https://res.cloudinary.com/drbc4wbvw/image/upload/v1781811698/PROMAX-LOGOTIPO_AI_VECTORES_Mesa_de_trabajo_1_copia_5_ak8pwn.svg",
    logoLight: "https://res.cloudinary.com/drbc4wbvw/image/upload/v1781811698/PROMAX-LOGOTIPO_AI_VECTORES_Mesa_de_trabajo_1_copia_5_ak8pwn.svg",
    logoText: "PROMAX",
    // Logo de WhatsApp para el botón flotante (imagen con transparencia: PNG/WEBP).
    // Déjalo vacío ("") para volver al ícono SVG por defecto.
    whatsappLogo: "https://res.cloudinary.com/drbc4wbvw/image/upload/v1781841452/whatsapp-logo-whatsapp-icon-whatsapp-transparent-free-png_amkiik.webp",
  },

  /* ---------- BANDERAS DEL SELECTOR DE IDIOMA ---------- */
  // Cambia el código (us, ve, co, es) por el país que prefieras.
  flags: {
    en: "https://flagcdn.com/w40/us.png",   // Inglés → Estados Unidos
    es: "https://flagcdn.com/w40/es.png",   // Español → España
  },

  /* ---------- CONTACTO ---------- */
  contact: {
    phone:        "(305) 676-1259",
    phoneRaw:     "13056761259",
    whatsapp:     "13056761259",
    email:        "Promaxautobroker@gmail.com",     // correo público + destino de leads
    address:      "7875 NW 107 Ave, Miami, FL 33178, United States",
    addressMaps:  "https://maps.google.com/?q=7875+NW+107+Ave,+Miami,+FL+33178",
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
    geo: { lat: 25.8245, lng: -80.3663 },            // 7875 NW 107 Ave, Doral/Miami
  },

  /* ---------- REDES SOCIALES ---------- */
  social: {
    instagram: "https://www.instagram.com/promaxautobroker/",
    facebook:  "https://www.facebook.com/104409542167703",
    youtube:   "https://www.youtube.com/@Promaxautobroker/community",
    tiktok:    "https://www.tiktok.com/@promaxautobroker",
  },

  /* ---------- INTEGRACIONES / BACKEND ---------- */
  endpoints: {
    // Webhook n8n que recibe los leads y los envía por WhatsApp/email (ver /automation).
    leadsWebhook: "https://n8n-ucallnow.ucallnow.fun/webhook/promax-leads",

    inventorySource: "json",
    inventoryApiUrl: "",
    inventoryApiKey: "",

    // Google Apps Script Web App para REFERIDOS -> Google Sheet.
    referralsScriptUrl: "",                          // <-- CONFIRMAR
    referralsToken: "promax-2026",

    // Instagram: déjalo VACÍO para usar la lista manual /assets/data/instagram.json
    // (ahí agregas o quitas reels; ver docs/INSTAGRAM.md). Si algún día usas un
    // widget que te dé un enlace de feed, lo pegas aquí y se actualizará solo.
    instagramFeed: "",
  },

  /* ---------- REFERIDOS / SORTEO ---------- */
  referrals: {
    goal: 100,
    soldStatus: "Vendido",
    raffleEnabled: true,
    passcode: "promax",                              // <-- CONFIRMAR
  },

  /* ---------- IDIOMA ---------- */
  i18n: {
    default: "es",
    available: ["es", "en"],
  },

  /* ---------- BARRA SUPERIOR (marquee) ---------- */
  marquee: {
    es: ["+500 Clientes Satisfechos", "Bajo Pago Inicial", "Aprobación Rápida", "Aceptamos ITIN", "Atención Personalizada", "Importamos a Venezuela 🇻🇪"],
    en: ["+500 Happy Clients", "Low Down Payment", "Fast Approval", "ITIN Accepted", "Personalized Service", "We Import to Venezuela 🇻🇪"],
  },
};
