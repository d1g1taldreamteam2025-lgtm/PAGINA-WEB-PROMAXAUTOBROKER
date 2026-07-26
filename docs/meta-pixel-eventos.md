# Meta Pixel de Promax — qué significa cada dato

Pixel de Meta (Facebook/Instagram): **`1709075950232187`**.
Todo esto se ve en **Meta Events Manager** (business.facebook.com), NO en nuestro
panel de Analytics (son sistemas separados).

## Dónde vive en el código
- **Base del pixel** (se enciende en cada página): `/assets/js/meta-pixel.js`
  (init + `PageView`). Está en el `<head>` de las 19 páginas públicas. **NO** en
  `/admin/` (las visitas del panel del staff no cuentan).
- **Eventos de conversión** (una sola fuente, con datos): `/assets/js/analytics.js`.
  El sitio ya registra sus propios eventos y los "refleja" a Meta con parámetros.

## Los eventos que enviamos y qué significan

| Evento (Meta) | Cuándo se dispara | Qué datos manda | Para qué sirve |
|---|---|---|---|
| **PageView** | En cada visita a cualquier página pública | — | Medir tráfico y armar públicos de "gente que visitó la web". |
| **ViewContent** | Cuando alguien abre la **ficha de un carro** (`/vehicle/?id=…`) | `content_type: "vehicle"`, `content_ids: [id del carro]` | Saber **qué vehículos** interesan. Permite **retargeting**: mostrar anuncios del carro exacto que la persona miró. |
| **Lead** | Cuando alguien **deja sus datos** (nombre+WhatsApp, cotización, "más info", financiamiento, boletín…). Pasa por `submitLead`, que es el embudo de TODOS los formularios. | `content_category: tipo de formulario` (ej. `quote`, `purchase`, `newsletter`), `content_ids: [id del carro]` si aplica | Es la **CONVERSIÓN** clave. Meta optimiza los anuncios para conseguir más gente que deja datos (no solo clics). |
| **Contact** | Clic en **WhatsApp** (botón flotante o enlaces `wa.me`) o en un **teléfono** (`tel:`) | `content_category: "whatsapp"` o `"telefono"` | Mide la intención de contactar directo. Sirve para optimizar y para públicos de "gente con intención alta". |

### Notas sobre los datos
- **`content_ids`** = el identificador del vehículo en nuestra base. Es lo que Meta
  usa para los **anuncios dinámicos** (mostrarle a la persona el mismo carro que vio).
  Si en el futuro se sube un **catálogo de productos** a Meta, estos ids son los que
  hacen el match.
- **`content_category`** en *Lead* = de qué formulario vino (cotización, compra,
  boletín…). Ayuda a ver qué tipo de lead convierte mejor.
- **`value` / `currency`**: por ahora no mandamos el precio como "valor" del evento.
  Se puede activar más adelante si se quiere medir retorno por monto.
- **PageView se dispara una sola vez** por carga (desde `meta-pixel.js`). Los eventos
  de conversión **no se duplican** (una sola fuente en `analytics.js`).

## Privacidad
- No enviamos datos sensibles a Meta (ni el nombre/teléfono del lead; eso queda solo
  en nuestra base Supabase). A Meta solo van los eventos estándar y el id del carro.
- El sitio **no tiene CSP**, así que el pixel carga sin bloqueos. Si algún día se
  agrega CSP, hay que permitir `connect.facebook.net` y `www.facebook.com`.

## Cómo verificar que funciona
1. **Meta Events Manager** → debería mostrar PageView y, al navegar la web, los
   eventos ViewContent / Lead / Contact en tiempo real.
2. Extensión **Meta Pixel Helper** (Chrome): abrir la web y ver el pixel activo + los
   eventos que dispara.

## Posible mejora futura (opcional)
- Mandar `value` (precio del carro) en ViewContent/Lead para medir retorno por monto.
- Subir un **catálogo de vehículos** a Meta para anuncios dinámicos (usa `content_ids`).
