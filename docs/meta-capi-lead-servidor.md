# Meta — evento Lead desde el SERVIDOR (Conversions API) en SU n8n

## Lo primero: ESTO ES OPCIONAL. Ya funciona sin esto.
El **Pixel del navegador** ya dispara el evento **`Lead`** cuando la solicitud se
envía correctamente. **La conversión YA se registra en Meta.** No falta nada para
que cuente. ✅

La Conversions API (CAPI = mandar el Lead también desde el servidor) es un **EXTRA
de confiabilidad**: recupera el ~10–20% de usuarios que bloquean el pixel del
navegador (ad-blockers, iOS restrictivo). Si NO la hacen, igual se cuenta la
mayoría de conversiones. Se puede agregar cuando quieran, sin prisa.

## Quién lo hace
**Ustedes**, porque **ustedes tienen el n8n** (el mismo workflow "Promax — Leads"
que ya recibe cada lead). Es agregar 2 nodos a ese workflow. No depende de nadie
externo.

## Lo ÚNICO que necesitan pedir: un "access token" de Meta (GRATIS)
No es algo que se compre ni que falte. Se **genera en 2 clics**, gratis, en la
misma cuenta de Meta donde está el pixel:

> Meta **Events Manager** → seleccionan el pixel `1709075950232187` → **Settings**
> → sección **Conversions API** → **Generate access token** → copian ese texto largo.

Quien tenga acceso a esa cuenta de Meta (Juan, que instaló el pixel) lo genera en
30 segundos. **Es secreto**: va DENTRO de n8n, nunca en la web. Eso es TODO lo que
hay que "pedir": _"Juan, genérame un access token de Conversions API del pixel
1709075950232187"._

## Cómo agregarlo al workflow (2 nodos, 5 minutos)
En el workflow **"Promax — Leads"**, después del nodo **"Format Lead"**, conectar
estos dos nodos nuevos (van en PARALELO, no estorban al WhatsApp/email):

**Nodo 1 — Code, nombre "CAPI · armar Lead":**
```js
const crypto = require('crypto');
const d = ($json && $json.raw) ? $json.raw : ($json.body || $json || {});
const sha = (v) => v ? crypto.createHash('sha256').update(String(v)).digest('hex') : undefined;
const email = (d.email || '').trim().toLowerCase();
const phone = (d.phone || '').replace(/[^0-9]/g, '');   // solo dígitos, con código de país
const user_data = {};
if (email) user_data.em = [sha(email)];
if (phone) user_data.ph = [sha(phone)];
if (d._fbp) user_data.fbp = d._fbp;
if (d._fbc) user_data.fbc = d._fbc;
const custom_data = { content_category: d.form_type || 'lead', currency: 'USD' };
if (d.vehicle_id) custom_data.content_ids = [String(d.vehicle_id)];
const body = { data: [{
  event_name: 'Lead',
  event_time: Math.floor(Date.now() / 1000),
  event_id: d._event_id,                 // MISMO id del navegador -> Meta DEDUPLICA
  action_source: 'website',
  event_source_url: d._source_url,
  user_data,
  custom_data
}] };
// Para PROBAR en Events Manager > Test Events, pon aquí tu código de prueba:
// body.test_event_code = 'TESTxxxx';
return { json: { capi_body: body } };
```
> Si su n8n bloquea `require('crypto')` en el Code node, arranquen n8n con la
> variable de entorno `NODE_FUNCTION_ALLOW_BUILTIN=crypto` (o usen el nodo
> **Crypto** de n8n para hashear `email` y `phone` en SHA256).

**Nodo 2 — HTTP Request, nombre "CAPI · enviar a Meta":**
- **Method:** `POST`
- **URL:** `https://graph.facebook.com/v20.0/1709075950232187/events?access_token=PEGA_AQUI_TU_TOKEN`
- **Body:** JSON → `={{ JSON.stringify($json.capi_body) }}`
- **Settings → On Error:** *Continue* (que un fallo de Meta nunca detenga el lead).

**Conexión:** arrastren una línea desde la salida de **"Format Lead"** hacia
**"CAPI · armar Lead"**, y de ahí a **"CAPI · enviar a Meta"**.

### Copiar-pegar directo en el lienzo de n8n
Copien este bloque y péguenlo en el canvas del workflow (Ctrl+V); luego conecten
"Format Lead" → "CAPI · armar Lead":
```json
{"nodes":[{"parameters":{"jsCode":"const crypto = require('crypto');\nconst d = ($json && $json.raw) ? $json.raw : ($json.body || $json || {});\nconst sha = (v) => v ? crypto.createHash('sha256').update(String(v)).digest('hex') : undefined;\nconst email = (d.email || '').trim().toLowerCase();\nconst phone = (d.phone || '').replace(/[^0-9]/g, '');\nconst user_data = {};\nif (email) user_data.em = [sha(email)];\nif (phone) user_data.ph = [sha(phone)];\nif (d._fbp) user_data.fbp = d._fbp;\nif (d._fbc) user_data.fbc = d._fbc;\nconst custom_data = { content_category: d.form_type || 'lead', currency: 'USD' };\nif (d.vehicle_id) custom_data.content_ids = [String(d.vehicle_id)];\nconst body = { data: [{ event_name: 'Lead', event_time: Math.floor(Date.now()/1000), event_id: d._event_id, action_source: 'website', event_source_url: d._source_url, user_data, custom_data }] };\nreturn { json: { capi_body: body } };"},"id":"capi-armar-lead","name":"CAPI · armar Lead","type":"n8n-nodes-base.code","typeVersion":2,"position":[480,560]},{"parameters":{"method":"POST","url":"https://graph.facebook.com/v20.0/1709075950232187/events?access_token=PEGA_AQUI_TU_TOKEN","sendBody":true,"specifyBody":"json","jsonBody":"={{ JSON.stringify($json.capi_body) }}","options":{}},"id":"capi-enviar-meta","name":"CAPI · enviar a Meta","type":"n8n-nodes-base.httpRequest","typeVersion":4.2,"position":[720,560],"onError":"continueRegularOutput"}],"connections":{"CAPI · armar Lead":{"main":[[{"node":"CAPI · enviar a Meta","type":"main","index":0}]]}}}
```

## Cómo probar
Meta **Events Manager → Test Events**: pongan su `test_event_code` en el código,
envíen el formulario de financiamiento, y verán el `Lead` llegar **del navegador**
(ya) y **del servidor** (cuando agreguen estos nodos), marcado como **deduplicado**
(cuenta 1, no 2).

## Qué ya dejó lista la web (para que esto funcione)
- El `Lead` del navegador dispara SOLO al confirmar el envío, con un **`_event_id`**
  único.
- Ese `_event_id` (+ cookies `_fbp`/`_fbc` + `_source_url`) viaja en el payload al
  webhook de n8n → los nodos de arriba solo lo reutilizan. Por eso Meta deduplica.
