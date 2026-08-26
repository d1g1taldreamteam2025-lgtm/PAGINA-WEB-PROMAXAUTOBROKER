# Entrega técnica — Promax Auto Broker

Documento de traspaso para el equipo técnico que recibe el proyecto.
Fecha: agosto 2026. Repositorio: `d1g1taldreamteam2025-lgtm/PAGINA-WEB-PROMAXAUTOBROKER`.

---

## 0. Léase primero: tres puntos bloqueantes

Antes de tocar código, hay tres cosas que condicionan todo el traspaso.

### 0.1 La base de datos usa la clave de ejemplo de Supabase

La `anonKey` que usan la web y el panel **no es una clave generada para Promax**: es la
clave DEMO por defecto del stack self-hosted de Supabase. El payload del JWT es
`{"iss":"supabase-demo","role":"anon","exp":1983812996}` y su firma valida con el secreto
de ejemplo que Supabase publica en su documentación.

**Consecuencia:** cualquiera que conozca ese secreto —está publicado— puede firmar un JWT
con `role: service_role` y saltarse por completo el RLS: leer, editar o borrar el
inventario, los leads con nombres y teléfonos de clientes, y los datos del sorteo.

**Acción obligatoria al migrar:** generar un `JWT_SECRET` nuevo y emitir claves `anon` y
`service_role` nuevas. No reutilizar las actuales bajo ningún concepto.

### 0.2 Todo el backend vive en infraestructura de la agencia saliente

| Servicio | Host actual | Qué sostiene |
|---|---|---|
| Base de datos + Storage | Supabase self-hosted (servidor de la agencia) | Inventario (521 vehículos), leads, analytics, sorteo, login del panel, 181 fotos |
| Webhook de leads | n8n (servidor de la agencia) | Aviso por WhatsApp y correo al vendedor |
| Gateway de WhatsApp | Evolution API interno de la agencia | Envío del mensaje de aviso |

El propio `config.js` anota que *"reutiliza el mismo servidor de Family Key"*: es
infraestructura **compartida** de la agencia, no dedicada a Promax.

Si ese servidor se apaga, la web sigue en pie (Vercel sirve el HTML estático) pero
**el catálogo queda vacío, el panel deja de abrir y no se captura ni un lead más**.

### 0.3 Hay que sacar una copia de seguridad ANTES de cortar el servicio

No existe ningún respaldo dentro del repo: cero dumps, cero exports. Y la `anon` key no
puede leer leads ni sorteo ni analytics (el RLS lo impide), así que **no se puede
reconstruir desde fuera**.

Hay que pedir por escrito y con fecha límite, mientras el servidor siga encendido:

1. `pg_dump` completo del esquema `public` con las tablas `promax_*`.
2. Export de `auth.users`, o confirmación de que el usuario admin se recreará a mano.
3. Copia del bucket `promax` de Storage (181 archivos).
4. Export del workflow n8n de leads y acceso al pixel de Meta.

Si no hay colaboración: con la `service_role` key se puede volcar todo por PostgREST con
`curl`, y las 181 fotos por HTTP (el bucket es público).

> **Riesgo principal del proyecto:** que se apague el servidor antes de este paso. En ese
> caso se pierden de forma irrecuperable el histórico de leads, el analytics, los datos del
> sorteo y las fotos propias del inventario.

---

## 1. Stack

**HTML + CSS + JavaScript plano. Sin framework, sin TypeScript, sin bundler, sin build.**
Lo que está en el repo es exactamente lo que se sirve.

- 19 páginas públicas + 5 del panel `/admin/` = 24 archivos `.html`
- 1 hoja de estilos: `assets/css/theme.css` (848 líneas)
- 9 archivos JS propios en `assets/js/` (~2.850 líneas) + `admin/gate.js`
- No hay `package.json` en la raíz. El único está en `tools/auto-sync/` (robot de
  inventario, con Playwright 1.47.2) y no forma parte del sitio.

### Requisitos de servidor

Hosting estático puro: no hay `/api`, ni funciones serverless, ni PHP, ni Node en runtime.
Sirve cualquier hosting estático. Dos condiciones duras:

1. **Debe servirse desde la raíz del dominio**, no desde un subpath: el sitio usa rutas
   absolutas (`/assets/…`, `/inventory/…`).
2. **Necesita URLs limpias con barra final** (`/inventory/` → `inventory/index.html`). En
   Vercel lo resuelve `vercel.json` (`trailingSlash: true`, `cleanUrls: true`); en
   Apache/Nginx hay que replicarlo.

### Librerías de terceros cargadas en runtime

| Librería | Origen | Dónde | Nota |
|---|---|---|---|
| `@supabase/supabase-js@2` | cdn.jsdelivr.net | 4 páginas de `/admin/` + `/referrals/` | ⚠️ Versión flotante `@2`: jsDelivr puede servir una v2 más nueva y romper el panel sin que nadie toque el código. **Conviene fijarla a `x.y.z`.** |
| GSAP + ScrollTrigger 3.12.5 | cdnjs.cloudflare.com | solo el home | Versión fija. Si no carga, hay guardia anti-parpadeo. |
| `fbevents.js` (Meta Pixel) | connect.facebook.net | todas las públicas | — |
| Google Fonts | fonts.googleapis.com | todas | — |

No hay jQuery, Bootstrap, Swiper ni Leaflet.

### Cómo correr en local

```bash
cd PAGINA-WEB-PROMAXAUTOBROKER
python3 -m http.server 8000
# abrir http://localhost:8000
```

**Nunca abrir el HTML con doble clic** (`file://`): las rutas absolutas y los `fetch`
fallan.

### Despliegue

Hoy publica **Vercel** (confirmado por los headers de producción: `server: Vercel`).
Vercel no se configura por workflow, sino conectando el repo desde su panel
(Framework: Other, sin build, sin output).

Este paquete se entrega como repositorio limpio: **una sola rama `main` y un único
commit inicial**, sin historial previo. No incluye workflows de GitHub Actions: los que
existían dependían de infraestructura de la agencia saliente y no aplican aquí.

---

## 2. Mapa del código

### Configuración — punto de entrada

**`assets/js/config.js`** es la fuente de verdad del front público: marca, contacto,
categorías del catálogo, redes, endpoints, base de datos, analytics y textos del marquee.

⚠️ **Pero el panel `/admin/` no lo usa.** Cada página del panel declara su propia
`SUPABASE_URL` y su propia `SUPABASE_ANON`. Al migrar hay que tocar **6 lugares, no 1**:

- `assets/js/config.js` líneas 90, 95, 96, 111, 112
- `admin/index.html:558`, `admin/leads.html:215`, `admin/analytics.html:200`, `admin/sorteo.html:318`

Si solo se cambia `config.js`, la web pública apuntará al servidor nuevo y el panel seguirá
escribiendo en el viejo — descuadre silencioso de datos.

**Mejora recomendada al recibir:** que las 4 páginas del panel lean `window.PROMAX.db`.

### Archivos JS

| Archivo | Líneas | Responsabilidad |
|---|---|---|
| `site.js` | 1433 | Motor del sitio: genera header, footer y widgets; i18n ES/EN; envío de leads (`submitLead`) |
| `inventory.js` | 604 | Catálogo interactivo (filtros, orden, paginación). Solo lo carga `/inventory/` |
| `data.js` | 440 | Capa de inventario contra Supabase REST + fallback local |
| `analytics.js` | 246 | Analítica propia hacia Supabase + GA4/Clarity opcionales + eventos Meta |
| `anim.js` | 185 | Animaciones de scroll (GSAP) |
| `instagram.js` | 151 | Rejilla de reels desde JSON local |
| `config.js` | ~150 | Configuración central |
| `meta-pixel.js` | 20 | Base del Pixel de Meta (ID hardcodeado) |
| `referrals.js` | — | ⚠️ **Código muerto: ningún HTML lo carga** |

### Datos locales

- `assets/data/instagram.json` — lista manual de 8 reels (videos alojados en el repo).
- `assets/data/inventory.json` — ⚠️ **contiene literalmente `[]`**. Ver punto 5.2.

---

## 3. Base de datos

Supabase self-hosted. **5 tablas**, todas con RLS activo, más un bucket de Storage y Auth.

⚠️ **No existe un esquema SQL consolidado ni migraciones versionadas.** Solo
`promax_analytics` tiene un `.sql` propio; el DDL de las otras 4 tablas está **dentro de
archivos Markdown** (`docs/PANEL-ADMIN.md`). Reconstruir la base en un servidor nuevo exige
ejecutar scripts sueltos en un orden concreto (ver §6, Paso 1).

### `promax_inventory` — catálogo (~521 filas)

`id text PK`, `created_at timestamptz`, `year int`, `make`, `model`, `trim`, `body_type`,
`status text default 'available'` (valores reales: `available` | `sold`), `condition`,
`price numeric`, `msrp`, `mileage int`, `fuel`, `transmission`, `drivetrain`, `engine`,
`exterior_color`, `interior_color`, `vin`, `stock`, `badge`, `mpg_city`, `mpg_highway`,
`featured boolean`, `features jsonb`, `description`, `gallery jsonb`, `cover_image`,
`reserved_at`, `reserved_by_name`, `reserved_by_email`, `reserved_by_phone`, `sold_at`.

Añadidas aparte: `category text NOT NULL default 'cars'`
(`cars|trucks_machinery|vans|motorcycles|utv|watercraft`), `featured_order integer`,
`source text` (dominio del dealer; `NULL` = carga manual, el robot nunca la toca),
`source_url text`, `last_sync timestamptz`.

**Índices:** `idx_promax_inventory_category(category)`;
`promax_inventory_featured_order_idx(featured_order) WHERE featured is true`;
`idx_pmx_inv_source_status(source, status, last_sync)`.

**RLS:** lectura pública para `anon`; todo para `authenticated`.

### `promax_inquiries` — leads

`id uuid PK default gen_random_uuid()` (requiere extensión **pgcrypto**), `created_at`,
`form_type`, `name`, `email`, `phone`, `vehicle_title`, `vehicle_id`, `message`,
`source_url`, `status text default 'new'`, `raw jsonb`.

**RLS:** `INSERT` para `anon`; `SELECT`/`UPDATE`/`DELETE` solo `authenticated`.
Está en la publicación `supabase_realtime` (el panel se actualiza en vivo).

⚠️ Dos detalles: no tiene índices más allá del PK, y el panel lee con `limit(500)`, así que
**a partir de 500 leads deja de ver los antiguos**.

### `promax_referrals` y `promax_settings` — sorteo

`promax_referrals`: `id uuid PK`, `created_at`, `round int`, `name`, `address`, `phone`,
`email`, `vehicle`, `vin`, `helper`, `ticket int` (1-1000; **la unicidad se valida solo en
el navegador, no en la base**), `status`, `notes`. RLS: solo `authenticated` — `anon` no
tiene ninguna política, correcto porque contiene datos personales.

`promax_settings`: `key text PK`, `value jsonb`, `updated_at`. Solo se usa la fila
`key='raffle'`. ⚠️ La política de lectura anónima expone **todas** las filas, no solo esa.

### `promax_analytics` — analítica propia

`id bigint identity PK`, `ts`, `visitor_id`, `session_id`, `event`
(`pageview|heat|whatsapp|call|form|vehicle_view|lang|share|popup|scroll|click`), `page`,
`ref`, `utm jsonb`, `device`, `lang`, `meta jsonb`.
Índices por `ts`, `(event, ts)` y `(page, ts)`.

⚠️ **No hay política de retención ni purga**: la tabla crece indefinidamente y el dashboard
tiene un tope de 60.000 filas por consulta, así que con tráfico alto los rangos largos
quedan truncados sin avisar.

### Storage y Auth

- **Bucket `promax`, carpeta `inventory/`**. Público, límite 50 MB, mimes
  `image/jpeg|png|webp|gif`. El panel achica en el navegador (máx 1600 px, calidad .85,
  WebP) y admite hasta 24 fotos por vehículo.
- **Las 181 fotos propias ya vienen en este paquete**, en `assets/img/inventory/`
  (optimizadas a máx 1600 px WebP) y con las URLs ya repuntadas dentro de
  `assets/data/inventory.json`. **No hay que rescatarlas del servidor anterior.**
  Al montar la base nueva, subirlas al bucket nuevo o servirlas desde el propio sitio.
- **Auth:** un solo usuario, sin roles. Cualquier sesión es admin total. Al migrar hay que
  recrearlo a mano con contraseña nueva.

### SQL pendiente de correr

1. `docs/supabase-storage-fotos.sql` — políticas del bucket.
2. `docs/supabase-featured-order.sql` — columna `featured_order`.

El segundo tiene auto-reparación en el código (si falta, guarda sin la columna y avisa).
Las columnas `source`/`source_url`/`last_sync` **no** tienen ese fallback: si faltan, el
robot semanal falla.

---

## 4. Integraciones y automatizaciones

### Leads (lo más crítico del negocio)

Cada formulario hace **dos** cosas: guarda en Supabase **y** hace `POST` al webhook n8n.

`site.js` considera el envío exitoso si **Supabase** guardó, aunque n8n falle. Por eso:
si se apaga el n8n, **los leads se siguen guardando y se ven en el panel, pero nadie recibe
el aviso por WhatsApp ni por correo**. Eso da margen: se puede migrar la base primero y la
notificación después.

Flujo n8n (`automation/promax-leads.n8n.json`):
`Webhook → Code "Format Lead" → HTTP Request (Evolution API, WhatsApp) → Gmail → Respond OK`.
Destinos: WhatsApp a `13056761259`, correo a `Promaxautobroker@gmail.com`.

`automation/build_workflow.js` es el **generador** de ese JSON — es la fuente de verdad, no
el JSON.

### Robot de inventario

`tools/auto-sync` + `.github/workflows/inventory-sync.yml`. Corre los lunes 10:00 UTC.
Usa Playwright para leer los sitios de los dealers y escribe en Supabase. Necesita los
secrets `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` (o el usuario/contraseña del admin).

### Meta Pixel

ID `1709075950232187`, hardcodeado en 21 sitios (`meta-pixel.js` + el `<noscript>` de cada
página). Eventos: `PageView` (base), `ViewContent` y `Contact` (`analytics.js`), `Lead`
(en `submitLead`, solo al confirmarse el éxito del envío). Deja preparados `_event_id`,
`_fbp` y `_fbc` para deduplicar con la Conversions API del servidor, que la agencia iba a
implementar en n8n.

### Código muerto y automatizaciones inútiles

- **Google Apps Script de referidos** (`google-apps-script/Code.gs`): desconectado.
  `referralsScriptUrl` está vacío. Hoy los referidos viven en Supabase.
- **`recover-cloudinary.yml`**: corre a diario vigilando dos cuentas de Cloudinary muertas.
  Ya no rescatará nada. **Borrar.**
- **`tools/dealercom-scraper`**: herramienta manual de demo, no automatizada.
- **`demo/toyota.json`**: 48 referencias a una cuenta de Cloudinary muerta.
- **`assets/js/referrals.js`** y **`demo/inventory.js`** (copia manual de `inventory.js`).

---

## 5. Credenciales y cuentas

### 5.1 Qué hay en el repo

| Credencial | Dónde | ¿Secreta? | Acción |
|---|---|---|---|
| Supabase `anon` key | `config.js:96,112` + 4 HTML del panel | Pública por diseño, **pero es la clave demo** | **Regenerar todo el JWT_SECRET** |
| Evolution API key (WhatsApp) | `automation/promax-leads.n8n.json:43` | **SÍ, secreta, en texto plano** | **Rotar.** Es de la agencia |
| `referralsToken` | `config.js:100` | No | Cambiar si se activa referidos |
| `referrals.passcode` | `config.js:142` | No | Marcado `<-- CONFIRMAR` |
| Meta Pixel ID | `meta-pixel.js` | Pública por diseño | Transferir la **cuenta**, no el ID |

**No están en el repo** (viven fuera y hay que reconfigurarlos): la credencial Gmail OAuth2
del envío de correo (dentro del n8n de la agencia), la contraseña del usuario admin de
Supabase Auth, y los secrets de GitHub Actions (`SUPABASE_SERVICE_KEY`, `FTP_*`).

> ⚠️ La `service_role` key de Supabase da **control total** de la base. Si está cargada como
> secret de GitHub, hay que rotarla al migrar.

### 5.2 Cuentas a transferir o recrear

1. **Dominio** `promaxautobroker.com` — en Hostinger, DNS apuntando a Vercel. *Confirmar registrante.*
2. **Hosting** — Vercel (proyecto `pagina-web-promaxautobroker`).
3. **Supabase** — migrar a instancia propia.
4. **n8n** — automatización de leads.
5. **Gateway de WhatsApp** — Evolution API (de la agencia; hay que montar uno propio).
6. **Meta** — Business Manager + Pixel `1709075950232187`.
7. **Google** — cuenta de envío de correo y `Promaxautobroker@gmail.com` como destino.
8. **Repositorio GitHub** — `d1g1taldreamteam2025-lgtm/PAGINA-WEB-PROMAXAUTOBROKER`.
9. **Redes** — @promaxautobroker (IG, TikTok, YouTube, Facebook). Solo enlaces, sin API.
10. **Cloudinary** — dos cuentas ya muertas. **No depender de ninguna.**

---

## 6. Plan de migración

Secuencia obligatoria por dependencias. **Total estimado: 25–37 horas (4–5 días).**

| Paso | Qué | Esfuerzo |
|---|---|---|
| **0** | **Copia de seguridad completa** mientras el servidor siga vivo (§0.3) | 2–4 h · **BLOQUEANTE** |
| 1 | Supabase nuevo en la cuenta del cliente + esquema | 4 h |
| 2 | Importar el dump + crear el usuario admin | 4 h |
| 3 | Rehospedar las 181 fotos + reescribir URLs | 3 h |
| 4 | Repuntar el código (17 referencias) | 4 h |
| 5 | Webhook de leads nuevo | 4–8 h |
| 6 | Vercel + GitHub + dominio | 3–6 h |
| 7 | Pixel de Meta | 1–3 h |
| 8 | Limpieza y documentación | 3 h |

### Paso 1 — Orden de los scripts SQL

1. `docs/PANEL-ADMIN.md` (bloque de `promax_inventory` + `promax_inquiries` + políticas)
2. `sql/add-category.sql`
3. `docs/supabase-featured-order.sql`
4. `sql/analytics.sql`
5. `docs/PANEL-ADMIN.md:159-193` (bloque del sorteo)
6. `docs/supabase-storage-fotos.sql` (bucket `promax`)

### Paso 3 — Fotos

Subir las 181 fotos al bucket nuevo y correr un `UPDATE` que reemplace
la ruta de fotos anterior (ya reemplazada por `/assets/img/inventory/…` en el export SQL) por la URL en `cover_image`
y dentro del jsonb `gallery` de esos 16 vehículos.

### Paso 4 — Las 17 referencias exactas

`config.js:90, 95, 96, 111, 112` · `admin/index.html:558-559` · `admin/leads.html:215-216` ·
`admin/analytics.html:200-201` · `admin/sorteo.html:318-319` · los `<link rel=preconnect>` de
`index.html:44`, `inventory/index.html:41` y `vehicle/index.html:24`.


### Paso 5 — Opciones para el aviso de leads

| Opción | Coste | Trabajo |
|---|---|---|
| **(a)** Database Webhook de Supabase → Resend/SendGrid + WhatsApp Cloud API oficial | Sin suscripción mensual | Media |
| **(b)** n8n propio importando `promax-leads.n8n.json`, cambiando solo el nodo de WhatsApp y Gmail | n8n Cloud ~$20/mes o self-hosted | Baja |
| **(c)** Make / Zapier | Suscripción | Baja |

Dado que el cliente no quiere suscripción mensual, **la opción (a) es la recomendada**.

### Paso 6 — Dominio sin caída

Agregar el dominio en el proyecto de Vercel nuevo **antes** de quitarlo del viejo:
el downtime queda cerca de cero.

### Coste recurrente después de migrar

Dominio (ya lo paga) · Vercel gratis o $20/mes · Supabase gratis o $25/mes si quieren
backups diarios · canal de notificación (WhatsApp Cloud API tiene capa gratuita).

---

## 7. Deuda técnica conocida

Lo que el equipo que reciba esto se va a encontrar, dicho sin adornos.

1. ~~El respaldo del inventario está vacío.~~ **Resuelto en esta entrega:**
   `assets/data/inventory.json` trae un volcado real de los **521 vehículos** disponibles.
   Si la base de datos no responde, el catálogo sigue mostrándose con estos datos.
2. **El repo pesa 317 MB**: 124 MB de videos versionados en git y ~184 MB de historial, con
   41 MB de blobs huérfanos. Candidato a Git LFS o a mover los videos a Storage.
3. **Había carpetas internas publicadas**: existe `.vercelignore` (excluye `docs/`,
   `automation/`, `google-apps-script/` y `*.py`), pero `sql/` —el esquema completo—,
   la documentación interna y `tools/` sí respondían 200 en producción. **Corregido en esta entrega**:
   se agregaron al `.vercelignore`. Ninguna página del sitio los referencia.
4. **`ASSETS.md` es un catálogo de URLs muertas** y contradice la regla del proyecto.
5. **`README.md` está desactualizado**: manda por caminos que ya no existen.
6. **`docs/PANEL-ADMIN.md` Paso 2** manda crear un preset de Cloudinary de una cuenta
   muerta; el uploader real usa Supabase Storage desde julio.
7. **Tres marcadores `<-- CONFIRMAR` vivos** en `config.js` (horarios, `referralsScriptUrl`,
   `passcode`) y un cuestionario al cliente sin cerrar en `docs/PREGUNTAS-CLIENTE.md`.
8. **Deuda operativa del inventario**: hay dealers bloqueados por Cloudflare y una fase del
   robot pausada; parte de la carga sigue siendo manual.

### Decisiones de producto que conviene respetar

Responden a pedidos explícitos del cliente:

- **Ningún asset en Cloudinary ni en CDNs de terceros.** Ya murieron dos cuentas con
  material dentro y no se pudo recuperar. Todo va en el repo o en Supabase Storage.
- **El correo de login del panel no debe aparecer en ningún lado**, ni en código ni en
  pantalla. Las 4 páginas del panel pintan "Admin" fijo.
- **Sin personas en los banners del hero** (se eliminó un slide por eso).
- **Nunca probar contra el webhook de leads en producción.** Cada POST dispara un
  WhatsApp y un correo reales al equipo de ventas y ensucia el panel de leads. Para
  probar formularios: servidor local con `endpoints.leadsWebhook` vacío — el lead se
  guarda igual en la base y el formulario responde éxito.
- El slide de importación a Venezuela **se quitó del home**: el visitante en EE.UU. creía
  que el negocio era solo envíos. El servicio sigue vivo en `/import/` y en el menú.
