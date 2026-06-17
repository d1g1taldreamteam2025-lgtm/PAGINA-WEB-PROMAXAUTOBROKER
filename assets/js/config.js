/* =========================================================================
   PROMAX AUTO BROKER — CONFIGURACIÓN CENTRAL DEL SITIO
   -------------------------------------------------------------------------
   Edita SOLO este archivo para cambiar datos de contacto, redes, textos
   de negocio y la conexión con Google Sheets. Todo el sitio lee de aquí.
   ========================================================================= */
window.PROMAX_CONFIG = {

  /* --- Identidad --- */
  brandName: "ProMax Auto Broker",
  brandShort: "ProMax",
  agentName: "Joel Jordá",
  sloganEs: "Tu aliado en cada compra SIN RIESGOS",
  sloganEn: "Your ally in every purchase WITHOUT RISKS",

  /* --- Contacto --- */
  phoneDisplay: "(305) 676-1259",
  phoneRaw: "13056761259",          // para enlaces tel: y wa.me (solo dígitos, con país)
  whatsappNumber: "13056761259",    // wa.me/<número>
  email: "info@promaxautobroker.com",  // <-- AJUSTAR si tienen correo real
  addressEs: "Miami, FL · Servicio a toda Venezuela",
  addressEn: "Miami, FL · Service to all Venezuela",
  hoursEs: "Lun–Sáb 9AM–7PM",
  hoursEn: "Mon–Sat 9AM–7PM",

  /* --- Redes sociales --- */
  instagram: "https://www.instagram.com/promaxautobroker/",
  facebook: "https://www.facebook.com/promaxautobroker",  // <-- VERIFICAR URL exacta
  tiktok: "",  // opcional

  /* --- Mensajes de WhatsApp prellenados --- */
  waMessageEs: "Hola ProMax, quiero información para comprar / importar un vehículo.",
  waMessageEn: "Hi ProMax, I want information to buy / import a vehicle.",

  /* --- BACKEND: Google Apps Script (Referidos + Leads -> Google Sheets) ---
     1) Crea una Google Sheet.
     2) Extensiones > Apps Script, pega el código de /google-apps-script/Code.gs
     3) Implementar > Nueva implementación > App web > Acceso: "Cualquier persona"
     4) Copia la URL /exec y pégala aquí abajo.
     Mientras esté vacío, los formularios funcionan en "modo demo" (no envían). */
  appsScriptUrl: "",   // <-- PEGAR URL /exec DE GOOGLE APPS SCRIPT

  /* --- Referidos (interno) --- */
  referralGoal: 100,             // ventas necesarias para el sorteo
  referralPasscode: "PROMAX2026",// clave simple de acceso al panel interno (cambiar)

  /* --- Idioma por defecto --- */
  defaultLang: "es"
};
