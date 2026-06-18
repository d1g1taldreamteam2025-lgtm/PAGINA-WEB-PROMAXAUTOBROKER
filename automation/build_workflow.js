/* Genera automation/promax-leads.n8n.json (workflow importable en n8n).
   Recibe los formularios de la web (webhook) y los envía por WhatsApp + Email. */
const fs = require("fs");

let _id = 0;
const uid = () => "pmx-node-" + (++_id).toString().padStart(3, "0");

// ---- Código del nodo "Format Lead" (se ejecuta dentro de n8n) ----
const formatCode = [
  "const d = $input.item.json.body || $input.item.json;",
  "const ft = d.form_type || 'contact';",
  "const T = {",
  "  financing:       ['💳','APLICACIÓN DE FINANCIAMIENTO'],",
  "  financing_quick: ['⚡','PRE-CALIFICACIÓN RÁPIDA'],",
  "  contact:         ['📩','CONTACTO'],",
  "  newsletter:      ['📧','SUSCRIPCIÓN NEWSLETTER'],",
  "  reserve:         ['🔒','RESERVA DE VEHÍCULO'],",
  "  quote:           ['💰','SOLICITUD DE PRECIO']",
  "};",
  "const t = T[ft] || T.contact;",
  "const isNl = ft === 'newsletter';",
  "const ts = new Date().toLocaleString('es-ES',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'});",
  "let wa = '*' + t[0] + ' PROMAX · ' + t[1] + '*\\n\\n';",
  "if (isNl) {",
  "  wa += 'Nueva suscripción al *newsletter*:\\n📧 ' + (d.email||'—');",
  "} else {",
  "  if (d.name)          wa += '*Nombre:* ' + d.name + '\\n';",
  "  if (d.email)         wa += '*Email:* ' + d.email + '\\n';",
  "  if (d.phone)         wa += '*Teléfono:* ' + d.phone + '\\n';",
  "  if (d.vehicle_title) wa += '*Vehículo:* ' + d.vehicle_title + '\\n';",
  "  if (d.vehicle_id)    wa += '*Vehículo ID:* ' + d.vehicle_id + '\\n';",
  "  if (d.message)       wa += '\\n*Detalle:*\\n' + d.message;",
  "}",
  "wa += '\\n\\n_' + ts + ' ET_';",
  "let h = '';",
  "h += '<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#EFEDEE;padding:20px\">';",
  "h += '<div style=\"background:#0a0a0a;color:#F4DC34;padding:22px;text-align:center;border-radius:10px 10px 0 0\">';",
  "h += '<h1 style=\"margin:0;font-size:20px;letter-spacing:1px\">PRO<span style=\"color:#fff\">MAX</span> AUTO BROKER</h1>';",
  "h += '<p style=\"margin:6px 0 0;color:#fff;font-size:13px\">Nuevo lead recibido</p></div>';",
  "h += '<div style=\"background:#fff;padding:24px;border-radius:0 0 10px 10px\">';",
  "h += '<h2 style=\"color:#0a0a0a;font-size:16px;margin:0 0 16px;padding:10px 14px;background:#fbe9e9;border-left:4px solid #A70200;border-radius:4px\">' + t[0] + ' ' + t[1] + '</h2>';",
  "if (isNl) {",
  "  h += '<p><strong>Email:</strong> <a href=\"mailto:' + (d.email||'') + '\" style=\"color:#A70200\">' + (d.email||'—') + '</a></p>';",
  "} else {",
  "  h += '<table style=\"width:100%;border-collapse:collapse\">';",
  "  if (d.name)          h += '<tr><td style=\"padding:9px 0;border-bottom:1px solid #eee\"><strong>Nombre:</strong> ' + d.name + '</td></tr>';",
  "  if (d.email)         h += '<tr><td style=\"padding:9px 0;border-bottom:1px solid #eee\"><strong>Email:</strong> <a href=\"mailto:' + d.email + '\" style=\"color:#A70200\">' + d.email + '</a></td></tr>';",
  "  if (d.phone)         h += '<tr><td style=\"padding:9px 0;border-bottom:1px solid #eee\"><strong>Teléfono:</strong> <a href=\"tel:' + d.phone + '\" style=\"color:#A70200\">' + d.phone + '</a></td></tr>';",
  "  if (d.vehicle_title) h += '<tr><td style=\"padding:9px 0;border-bottom:1px solid #eee\"><strong>Vehículo:</strong> ' + d.vehicle_title + '</td></tr>';",
  "  h += '</table>';",
  "  if (d.message) h += '<div style=\"margin-top:14px;padding:14px;background:#EFEDEE;border-left:3px solid #F4DC34;border-radius:4px;white-space:pre-wrap\">' + String(d.message).replace(/</g,'&lt;') + '</div>';",
  "}",
  "h += '<div style=\"margin-top:20px;padding-top:14px;border-top:1px solid #eee;color:#888;font-size:11px\">Recibido: ' + ts + ' ET</div></div></div>';",
  "const subject = 'PROMAX · ' + t[1] + (d.name ? ' · ' + d.name : '');",
  "return { json: {",
  "  raw: d, wa_message: wa, email_subject: subject, email_html: h,",
  "  recipient_wa: '13056761259',",            // Joel Jorda (305-676-1259)
  "  recipient_email: 'CORREO_PENDIENTE@ejemplo.com'", // <-- cambiar cuando lo tengan
  "} };"
].join("\n");

const nodes = [
  {
    parameters: { httpMethod: "POST", path: "promax-leads", responseMode: "responseNode", options: {} },
    id: uid(), name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 2,
    position: [-1120, 300], webhookId: "promax-leads"
  },
  {
    parameters: { jsCode: formatCode },
    id: uid(), name: "Format Lead", type: "n8n-nodes-base.code", typeVersion: 2, position: [-880, 300]
  },
  {
    parameters: {
      method: "POST",
      url: "http://TU-EVOLUTION-API:8080/message/sendText/TU_INSTANCIA",
      sendHeaders: true,
      headerParameters: { parameters: [{ name: "apikey", value: "TU_EVOLUTION_APIKEY" }] },
      sendBody: true, specifyBody: "json",
      jsonBody: '={\n  "number": {{ JSON.stringify($(\'Format Lead\').item.json.recipient_wa) }},\n  "text": {{ JSON.stringify($(\'Format Lead\').item.json.wa_message) }}\n}',
      options: {}
    },
    id: uid(), name: "Send WhatsApp", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
    position: [-640, 300], onError: "continueRegularOutput"
  },
  {
    parameters: {
      sendTo: "={{ $('Format Lead').item.json.recipient_email }}",
      subject: "={{ $('Format Lead').item.json.email_subject }}",
      message: "={{ $('Format Lead').item.json.email_html }}",
      options: { appendAttribution: false }
    },
    id: uid(), name: "Send Email", type: "n8n-nodes-base.gmail", typeVersion: 2.2,
    position: [-400, 300], webhookId: "promax-email",
    credentials: { gmailOAuth2: { id: "REEMPLAZAR_CRED", name: "Promax Gmail" } },
    onError: "continueRegularOutput"
  },
  {
    parameters: { respondWith: "json", responseBody: '={ "success": true, "message": "Lead recibido" }', options: {} },
    id: uid(), name: "Respond OK", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1, position: [-160, 300]
  },
  {
    parameters: {
      content: [
        "## Promax — Leads por WhatsApp",
        "Recibe los formularios de la web y los reenvía a Joel por WhatsApp + Email.",
        "",
        "**Configura antes de activar:**",
        "1. *Send WhatsApp* → pon tu URL de Evolution API, tu INSTANCIA y tu APIKEY (las mismas de UCallNow).",
        "2. *Send Email* → selecciona tu credencial de Gmail y cambia `recipient_email` en *Format Lead* cuando tengan el correo.",
        "3. El número de WhatsApp ya está: **13056761259** (Joel).",
        "4. Webhook URL: `https://n8n-ucallnow.ucallnow.fun/webhook/promax-leads` (ya configurada en la web).",
        "",
        "*Opcional:* se puede agregar generación de PDF para financiamiento (como en FK)."
      ].join("\n"),
      height: 320, width: 420, color: 4
    },
    id: uid(), name: "Instrucciones", type: "n8n-nodes-base.stickyNote", typeVersion: 1, position: [-1120, -60]
  }
];

const connections = {
  "Webhook": { main: [[{ node: "Format Lead", type: "main", index: 0 }]] },
  "Format Lead": { main: [[{ node: "Send WhatsApp", type: "main", index: 0 }]] },
  "Send WhatsApp": { main: [[{ node: "Send Email", type: "main", index: 0 }]] },
  "Send Email": { main: [[{ node: "Respond OK", type: "main", index: 0 }]] }
};

const workflow = { name: "Promax — Leads por WhatsApp", nodes, connections, settings: { executionOrder: "v1" }, pinData: {} };

fs.writeFileSync(__dirname + "/promax-leads.n8n.json", JSON.stringify(workflow, null, 2));
console.log("OK -> automation/promax-leads.n8n.json  (" + nodes.length + " nodos)");
