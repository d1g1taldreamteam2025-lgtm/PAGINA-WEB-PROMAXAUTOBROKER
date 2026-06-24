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
    // Logo oficial (Cloudinary). El header/footer es oscuro, por eso usamos el mismo en ambos.
    logo: "https://res.cloudinary.com/drbc4wbvw/image/upload/v1782163987/Logos-05_cqy7tj.png",
    logoLight: "https://res.cloudinary.com/drbc4wbvw/image/upload/v1782163987/Logos-05_cqy7tj.png",
    logoText: "PROMAX",
    // Ícono de WhatsApp del botón flotante. Vacío ("") = ícono integrado nítido
    // (teléfono BLANCO sobre círculo verde). Si quieres una imagen propia, pega su
    // URL aquí: usa un logo CLARO/BLANCO con fondo transparente (PNG/WEBP), no uno
    // verde (se confundiría con el fondo verde del botón).
    whatsappLogo: "",
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

    // Inventario EN VIVO desde Supabase (lo controla el panel admin). Si la tabla
    // está vacía o falla, la web usa /assets/data/inventory.json como respaldo.
    inventorySource: "static",
    inventoryApiUrl: "https://db.ucallnow.fun/rest/v1/promax_inventory?select=*&status=eq.available&order=created_at.desc",
    inventoryApiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",

    // Google Apps Script Web App para REFERIDOS -> Google Sheet.
    referralsScriptUrl: "",                          // <-- CONFIRMAR
    referralsToken: "promax-2026",

    // Instagram: déjalo VACÍO para usar la lista manual /assets/data/instagram.json
    // (ahí agregas o quitas reels; ver docs/INSTAGRAM.md). Si algún día usas un
    // widget que te dé un enlace de feed, lo pegas aquí y se actualizará solo.
    instagramFeed: "",
  },

  /* ---------- BASE DE DATOS (Supabase) — leads + panel admin ---------- */
  // Reutiliza el mismo servidor de Family Key, con tablas propias de Promax.
  db: {
    url: "https://db.ucallnow.fun",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    inquiriesTable: "promax_inquiries",
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
