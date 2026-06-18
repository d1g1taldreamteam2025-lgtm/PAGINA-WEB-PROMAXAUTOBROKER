/* Genera automation/promax-instagram.n8n.json
   Workflow que expone los últimos 15 reels/posts de Instagram como JSON
   para que la sección "Nosotros" de la web se actualice sola.
   El sitio (instagram.js) hace fetch a la URL del webhook de este workflow. */
const fs = require("fs");

let _id = 0;
const uid = () => "ig-node-" + (++_id).toString().padStart(3, "0");

// ---- Código del nodo "Format" (normaliza la respuesta de Instagram) ----
const formatCode = [
  "// Toma la respuesta de la API de Instagram y la deja lista para la web.",
  "const r = $input.item.json;",
  "const data = (r && r.data) || [];",
  "const out = data.slice(0, 15).map(function (m) {",
  "  return {",
  "    permalink: m.permalink || 'https://www.instagram.com/promaxautobroker/',",
  "    thumbnail: m.thumbnail_url || m.media_url || '',",
  "    type: m.media_type || 'IMAGE',",
  "    caption: m.caption || ''",
  "  };",
  "});",
  "return { json: { data: out } };"
].join("\n");

const nodes = [
  {
    parameters: {
      content: [
        "## Promax — Instagram automático",
        "Muestra tus últimos 15 reels en la web (sección *Nosotros*) y se actualiza solo.",
        "",
        "### Pasos (una sola vez)",
        "1. **Import** este workflow en n8n.",
        "2. Abre el nodo **🔑 Ajustes (EDITA AQUÍ)** y pega tu **token de Instagram** en `ig_token`.",
        "3. Activa el workflow (toggle arriba a la derecha).",
        "4. Copia la **Production URL** del nodo *Webhook* y pégala en",
        "   `assets/js/config.js` → `endpoints.instagramFeed`.",
        "",
        "### ¿De dónde sale el token?",
        "Cuenta de Instagram **Profesional** (Negocio/Creador) → en",
        "developers.facebook.com creas una app *Instagram* y generas un",
        "**token de larga duración** (dura 60 días).",
        "",
        "El token se renueva con el otro workflow incluido *(refresh)* o",
        "pegando uno nuevo. Si prefieres no usar la API, deja",
        "`instagramFeed` vacío y edita `assets/data/instagram.json` a mano."
      ].join("\n"),
      height: 420, width: 460, color: 6
    },
    id: uid(), name: "Instrucciones", type: "n8n-nodes-base.stickyNote", typeVersion: 1, position: [-1180, -120]
  },
  {
    parameters: { httpMethod: "GET", path: "promax-instagram", responseMode: "responseNode", options: {} },
    id: uid(), name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 2,
    position: [-1120, 320], webhookId: "promax-instagram"
  },
  {
    parameters: {
      assignments: {
        assignments: [
          { id: "a1", name: "ig_token", value: "PEGA_AQUI_TU_TOKEN_DE_INSTAGRAM", type: "string" },
          { id: "a2", name: "ig_user_id", value: "me", type: "string" }
        ]
      },
      options: {}
    },
    id: uid(), name: "🔑 Ajustes (EDITA AQUÍ)", type: "n8n-nodes-base.set", typeVersion: 3.4,
    position: [-880, 320]
  },
  {
    parameters: {
      url: "=https://graph.instagram.com/{{ $json.ig_user_id }}/media",
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: "fields", value: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp" },
          { name: "limit", value: "15" },
          { name: "access_token", value: "={{ $json.ig_token }}" }
        ]
      },
      options: {}
    },
    id: uid(), name: "Instagram API", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
    position: [-640, 320], onError: "continueRegularOutput"
  },
  {
    parameters: { jsCode: formatCode },
    id: uid(), name: "Format", type: "n8n-nodes-base.code", typeVersion: 2, position: [-400, 320]
  },
  {
    parameters: {
      respondWith: "json",
      responseBody: "={{ JSON.stringify($json) }}",
      options: { responseHeaders: { entries: [
        { name: "Access-Control-Allow-Origin", value: "*" },
        { name: "Cache-Control", value: "public, max-age=900" }
      ] } }
    },
    id: uid(), name: "Respond JSON", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1, position: [-160, 320]
  },

  /* ---------- Sub-flujo opcional: renovar token cada 50 días ---------- */
  {
    parameters: {
      content: [
        "### (Opcional) Renovar token solo",
        "Este lado renueva el token de Instagram automáticamente",
        "cada 50 días para que nunca se venza.",
        "Si lo usas, pega el token también aquí abajo."
      ].join("\n"),
      height: 230, width: 360, color: 3
    },
    id: uid(), name: "Nota Refresh", type: "n8n-nodes-base.stickyNote", typeVersion: 1, position: [-1180, 640]
  },
  {
    parameters: { rule: { interval: [{ field: "days", daysInterval: 50 }] } },
    id: uid(), name: "Cada 50 días", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2,
    position: [-1120, 820]
  },
  {
    parameters: {
      assignments: { assignments: [
        { id: "b1", name: "ig_token", value: "PEGA_AQUI_TU_TOKEN_DE_INSTAGRAM", type: "string" }
      ] },
      options: {}
    },
    id: uid(), name: "Token actual", type: "n8n-nodes-base.set", typeVersion: 3.4,
    position: [-880, 820]
  },
  {
    parameters: {
      url: "https://graph.instagram.com/refresh_access_token",
      sendQuery: true,
      queryParameters: { parameters: [
        { name: "grant_type", value: "ig_refresh_token" },
        { name: "access_token", value: "={{ $json.ig_token }}" }
      ] },
      options: {}
    },
    id: uid(), name: "Renovar token", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
    position: [-640, 820], onError: "continueRegularOutput"
  }
];

const connections = {
  "Webhook": { main: [[{ node: "🔑 Ajustes (EDITA AQUÍ)", type: "main", index: 0 }]] },
  "🔑 Ajustes (EDITA AQUÍ)": { main: [[{ node: "Instagram API", type: "main", index: 0 }]] },
  "Instagram API": { main: [[{ node: "Format", type: "main", index: 0 }]] },
  "Format": { main: [[{ node: "Respond JSON", type: "main", index: 0 }]] },
  "Cada 50 días": { main: [[{ node: "Token actual", type: "main", index: 0 }]] },
  "Token actual": { main: [[{ node: "Renovar token", type: "main", index: 0 }]] }
};

const workflow = {
  name: "Promax — Instagram (Nosotros)",
  nodes, connections, settings: { executionOrder: "v1" }, pinData: {}
};

fs.writeFileSync(__dirname + "/promax-instagram.n8n.json", JSON.stringify(workflow, null, 2));
console.log("OK -> automation/promax-instagram.n8n.json  (" + nodes.length + " nodos)");
