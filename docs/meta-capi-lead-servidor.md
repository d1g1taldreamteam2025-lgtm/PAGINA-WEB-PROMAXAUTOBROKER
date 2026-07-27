# Meta — evento Lead desde el SERVIDOR (Conversions API) para UCallNow

## Estado actual (lado web — YA hecho)
El **Pixel** (navegador) dispara el evento **`Lead`** SOLO cuando la solicitud de
financiamiento (y cualquier formulario) **se envía correctamente** — después de
guardar los datos y confirmar el éxito, **nunca** al solo hacer clic. Verificado.

Cada envío genera un **`_event_id` único** que viaja en el payload del lead a:
- el **webhook de n8n** (`leadsWebhook`), y
- Supabase (`promax_inquiries`, columna `raw`).

El payload también incluye (best-effort) las cookies del pixel **`_fbp`** y **`_fbc`**
y `_source_url`, para mejorar el emparejamiento del lado servidor.

## Qué falta (lado servidor — lo hace UCallNow)
Para redundancia (sobrevive a ad-blockers e iOS), enviar el **mismo** evento `Lead`
por la **Conversions API** desde el servidor, usando el **MISMO `_event_id`** → Meta
**deduplica** y no cuenta doble.

El lugar natural es **n8n** (ya recibe cada lead). Agregar un nodo HTTP Request:

```
POST https://graph.facebook.com/v20.0/1709075950232187/events?access_token=EL_TOKEN
Content-Type: application/json
```

Cuerpo (mapeando desde el payload del lead que ya llega a n8n):

```json
{
  "data": [
    {
      "event_name": "Lead",
      "event_time": 1234567890,
      "event_id": "{{ $json._event_id }}",
      "action_source": "website",
      "event_source_url": "{{ $json._source_url }}",
      "user_data": {
        "em": ["<SHA256( email en minúsculas y sin espacios )>"],
        "ph": ["<SHA256( teléfono solo dígitos, con código de país )>"],
        "fbp": "{{ $json._fbp }}",
        "fbc": "{{ $json._fbc }}"
      },
      "custom_data": {
        "content_category": "{{ $json.form_type }}",
        "currency": "USD"
      }
    }
  ]
}
```

### Reglas importantes
1. **`event_id` = `_event_id` del payload** (NO generar uno nuevo). Es lo que hace la
   deduplicación con el pixel del navegador. Sin esto, Meta contaría 2 leads por envío.
2. **`event_time`** = hora en **segundos** Unix (UTC). Usar el momento del envío
   (o `Math.floor(Date.now()/1000)`; no más de 7 días atrás).
3. **`em` y `ph` van HASHEADOS con SHA-256**, normalizados antes de hashear:
   - email → minúsculas + sin espacios al inicio/fin.
   - teléfono → **solo dígitos**, incluyendo código de país (ej. `13056761259`).
   (n8n tiene el nodo *Crypto* → SHA256, o hacerlo en un *Function* node.)
4. **`fbp`/`fbc`** van tal cual (sin hashear); si vienen vacíos, se pueden omitir.
5. El **access token** se genera en: Meta **Events Manager** → tu pixel →
   *Settings* → *Conversions API* → *Generate access token*. **Es secreto** (guardarlo
   en las credenciales de n8n, nunca en el sitio web).

### Cómo probar
- Meta **Events Manager** → *Test Events*: pega el `test_event_code` en el body
  (`"test_event_code": "TESTxxxx"`) y verás llegar el Lead del servidor.
- En *Events Manager* → el evento `Lead` debe mostrar **"Recibido de: Servidor y
  Navegador"** y **deduplicado** (no el doble).

## Resumen
- **Web:** ✅ Lead en el navegador al confirmar el envío, con `_event_id` para dedup.
- **Servidor (UCallNow):** agregar en n8n el POST a la Conversions API con ese mismo
  `_event_id` + em/ph hasheados. El token lo pone UCallNow (es secreto de ellos).
