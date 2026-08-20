# Promax Auto Broker — Guía del proyecto

## 🚨 REGLA DE ORO #0: PROHIBIDO probar contra el webhook de leads EN VIVO

**19-ago-2026: tres agentes de una auditoría hicieron POST al webhook real para
comprobar que estaba vivo. Resultado: al teléfono del cliente (13056761259)
llegaron 3 mensajes de WhatsApp "PROMAX · CONTACTO", uno de ellos con
`Nombre: _audit_test`. El encargado del sitio reclamó que se ve poco
profesional. No puede repetirse.**

`https://n8n-ucallnow.ucallnow.fun/webhook/promax-leads` **NO es un endpoint de
pruebas**: cada POST dispara un WhatsApp y un correo REALES a la gente que
atiende las ventas, y además crea una fila en `promax_inquiries` que ensucia el
panel de leads (y no se puede borrar con la clave pública: la RLS solo deja
DELETE a `authenticated`; hay que entrar a `/admin/leads.html`).

Aplica a TODO: yo mismo, subagentes, workflows y scripts.

**Prohibido, sin excepciones:**
- `curl -X POST` (ni `-d`, ni `--data`, ni un `{}` vacío) contra esa URL.
- Enviar cualquier formulario del sitio en producción.
- Llamar a `submitLead()` contra el webhook real.

**Si hay que comprobar que el webhook está arriba**, usar SOLO métodos que no
disparen el flujo: un `HEAD`, o un `GET` (n8n responde 404 "not registered for
GET", que YA confirma que el servicio responde), o `curl -I` al dominio. Nunca
un POST.

**Para probar formularios de verdad:** servidor local (`python3 -m http.server`)
con `endpoints.leadsWebhook` vacío en una copia de `config.js`. El front está
hecho para eso: si el webhook está vacío, el lead se guarda igual y el formulario
responde éxito (`site.js`), así que se prueba el camino completo sin molestar a
nadie.

**Lo mismo para el resto de canales del cliente:** nada de mensajes de prueba por
WhatsApp, correo, Instagram ni el formulario de referidos.

## 🚫 REGLA DE ORO: NO depender de Cloudinary (pedido de Jorge, jul 2026)

La cuenta de Cloudinary `drbc4wbvw` quedó SUSPENDIDA (HTTP 401 en TODO su
contenido) y rompió media web de un día para otro: logos, banners de
referidos/precalifica/importación, popup 15% OFF, videos y logos de bancos.
No hubo forma de recuperar los archivos (Wayback tampoco los tenía).

⚠️ ACTUALIZACIÓN 25-jul-2026: la SEGUNDA cuenta (`kcixfvoq`) TAMBIÉN murió
(HTTP 404 en todo). Se perdieron los heros de about/auction/carfax/contact/
faqs/inventory y home slides 1-2, y los 8 videos del inventario. Estabilizado
así (todo verificado):
- Home: slide 1 → arte local de /import/, slide 2 → arte local de /financing/
  (los 2 con sus 4 variantes locales); slide 3 $500 ya era local. Slides con
  guardia onerror (se ocultan y el carrusel recuenta puntitos vía resize).
- about/auction/carfax/contact/faqs/inventory/demo: RESTAURADOS (26-jul) con
  los artes nuevos de Joel — `/assets/img/heroes/<pagina>-{es,en}-pc.webp`
  (1672×941, WebP ~q90). Decisión de Jorge: el MISMO arte 16:9 se usa también
  en teléfono (se ve bien y evita pedir 12 verticales); por eso cada head
  declara `ar` y `ar-m` = "1672/941". El script del póster sigue blindado.
- Videos inventario: RESTAURADOS (26-jul) con reels NUEVOS que Joel escogió
  (Jorge los pasó por Drive). Alojados LOCAL en `/assets/video/inventory/reel-NN
  .mp4` (720×1280 vertical 9:16, avc1/mp4a = H.264/AAC, ya vienen con faststart)
  y servidos por `assets/data/instagram.json`. **Son 8** (Jorge mandó 10 pero
  pidió quitar los que "sobraban"). Para que NO queden huecos en blanco (exigencia
  de Jorge), la cuadrícula de about se pasó a **4 columnas (PC/tablet) y 2 (móvil)**
  en `theme.css`: 8=4+4 y 8=4×2, fila llena en cualquier ancho (antes era 5/3/2col
  y 8 dejaba huecos: 5+3). El **home tiene su PROPIO diseño** (`#pmxVideos
  .pmx-ig__grid` = 3-col centrado máx 760px en PC + carrusel deslizable en móvil):
  muestra `data-limit="3"` = fila llena de 3, NO se toca. La sección "Lo más
  reciente en Instagram" aparece en home (preview de 3) y en about (`#videos`,
  sin límite → los 8, grid 4×2 en PC / 2×4 en móvil). Sin
  `poster` (el sandbox no decodifica H.264 → no genero miniaturas): media-
  fragment `#t=0.1` para que el navegador real muestre el primer frame; fallback
  = tile oscuro + botón play. **Hover = reproduce CON sonido** (mouseenter:
  muted=false+play; mouseleave: pause+muted=true+reset); el clic abre el
  lightbox con controles. CAPTIONS quedaron vacías por decisión de Jorge ("no
  importa, déjalo sin eso"). Respaldo de captions VIEJOS (los 8 reels muertos)
  en `docs/instagram-videos-respaldo.json`.
- Favicons: rescatados a `/assets/img/favicon-256.png` y `favicon-180.png`
  (estaban en una 3ª cuenta `dol89fbil`, aún viva de milagro).
- Thumbs del catálogo: `data.js:thumb()` sirve DIRECTO la URL del dealer (el
  proxy fetch usaba kcixfvoq). `<link preconnect cloudinary>` eliminado.

**Política (más vigente que nunca):**
1. TODO asset (logos, banners, flyers, íconos, videos) se guarda **en este
   repo** (`/assets/...`) o en **Supabase Storage** — NUNCA en Cloudinary ni
   CDNs de terceros. Ya murieron DOS cuentas con material dentro.
2. Nada del sitio puede apuntar a `res.cloudinary.com`. Si un asset llega por
   URL externa, descargarlo y alojarlo local antes de referenciarlo.
3. `.github/workflows/recover-cloudinary.yml` vigila a diario AMBAS cuentas
   muertas y descarga a `assets/img/recovered/` lo que reviva.

## Assets locales actuales
- `/assets/img/logo-header.svg` — logo oficial BLANCO (header, barra móvil,
  footer, admin oscuro, sorteo vía JS usa logoDark en fondos claros).
- `/assets/img/logo-footer.png` — logo oficial NEGRO/amarillo (fondos claros:
  login admin, centro del orbit, sorteo).
- `/assets/img/promax-og.png` — 1200×630 para og:image/twitter (todas las páginas).
- `/assets/img/brands/*.png` — 12 logos de marcas (orbit del home).
- `/assets/img/banks/*.png` — 5 logos de bancos (financing + tchips del home);
  Service Credit Union no tiene logo → chip de texto (fallback automático).
- `/assets/img/flag-es.png`, `flag-us.png` — banderas selector de idioma.
- `/assets/img/google-g.svg` — G de Google (reseñas).

## Restauración post-caída: COMPLETA (jul 2026)
Jorge re-generó y pasó por el chat todos los artes; quedaron LOCALES:
- `/assets/img/promo/15off-{es,en}.webp` — popup 15% OFF (gateado: solo abre si carga).
- `/assets/img/heroes/import-*.webp`, `financing-*.webp`, `referidos-*.webp` —
  heros de /import/, /financing/ y slide 3 del carrusel del home (ES/EN × PC/móvil).
- `/assets/video/bienvenida-{es,en}.mp4` — video de /about/ (H.264/AAC, faststart
  aplicado con qt-faststart casero; el ffmpeg del sandbox es solo-webm y el
  Chromium del sandbox NO decodifica H.264 → validar por presencia + HTTP, no por
  reproducción). Los videos pesan ~25MB c/u en el repo — candidato #1 a migrar a
  Supabase Storage.

## Uploader del admin → Supabase Storage (jul 2026)
El widget de Cloudinary se eliminó (daba "cloud_name is disabled"). `admin/index.html`
ahora sube con `sb.storage.from('promax')` a la carpeta `inventory/`:
- Achica en el navegador (máx 1600px, calidad .85, WebP si el navegador puede).
- `pickPhotos()` / `uploadPhotos()` / `shrinkImage()` / `uploadOnePhoto()`; UI:
  `#photoInput`, `#photoDrop` (arrastrar), `#uploadQueue`, `#storageSetup`.
- Si falta el bucket: intenta crearlo con la sesión del admin y, si el servidor
  lo rechaza (RLS), muestra el aviso con el SQL — `docs/supabase-storage-fotos.sql`.
- `data.js:thumb()` sirve DIRECTO cualquier URL con `/storage/v1/object/public/`
  (ya vienen optimizadas) en vez de pasarlas por el proxy de Cloudinary.
⚠️ Pendiente del lado del cliente: correr ese SQL una vez en Supabase.

## Vehículos Destacados de la portada + ORDEN manual (jul 2026)
La sección "Vehículos Destacados" del home (`#pmxFeatured` en `index.html`)
ahora pone SIEMPRE PRIMERO los carros marcados `featured` en el panel (antes
`featured` solo reordenaba dentro de un round-robin variado por categoría, así
que marcar "Destacado" NO garantizaba que saliera — queja de Jorge). Lógica
nueva: destacados primero (ordenados por `featured_order` asc, menor = primero;
vacío = al final por año) + relleno VARIADO por categoría hasta 12.
- Panel (`admin/index.html`): checkbox `#fFeatured` + input nº `#fFeatOrder`
  ("Orden en portada"). Se guarda `featured_order` en el payload. Guardado con
  AUTO-REPARACIÓN: si la columna aún no existe, guarda sin ella y avisa el SQL.
- El home lee el orden con un fetch APARTE y tolerante a fallos
  (`select=id,featured_order&featured=eq.true`); si la columna no existe o falla,
  igual renderiza (destacados primero por año). NUNCA toca la carga principal
  del inventario (el SLIM sigue intacto → cero riesgo a los 505 carros).
⚠️ Pendiente del cliente: correr `docs/supabase-featured-order.sql` una vez
(agrega la columna `featured_order`). Sin correrlo, todo funciona salvo el orden
manual (los destacados salen primero por año).

## Meta Pixel (Facebook) — jul 2026
Pixel de Meta `1709075950232187` (lo pidió Juan de UCallNow para anuncios).
- **BASE** en `/assets/js/meta-pixel.js` (init + `PageView`). Cada página PÚBLICA
  carga ese `<script>` en el `<head>` + un `<noscript>` de respaldo. Insertado en
  las 19 páginas públicas; **NO en `/admin/`** (no ensuciar datos con el staff).
- **EVENTOS DE CONVERSIÓN** (con parámetros, cada uno UNA vez):
  · `ViewContent` y `Contact` → en `/assets/js/analytics.js` (refleja los eventos
    ya cableados del sitio: `vehicle_view→ViewContent` content_ids=id;
    `whatsapp/call→Contact` content_category=whatsapp/telefono). Se le quitó a
    analytics.js su init propio (lo hace meta-pixel.js) para no duplicar PageView.
  · `Lead` → en `submitLead` (`site.js`), NO en analytics.js. Se dispara SOLO al
    confirmar el ÉXITO del envío (Supabase guardó o webhook confirmó), NUNCA en el
    clic — pedido de Juan/UCallNow (el `form→Lead` del wrap se QUITÓ de FB_EVENTS).
    Cubre TODOS los formularios (financiamiento, contacto, cotización, newsletter…).
    Manda content_category=form_type, content_ids=id, y un `_event_id` único +
    `_fbp`/`_fbc` en el payload (→ n8n y Supabase.raw) para DEDUP con la Conversions
    API del servidor. Verificado: financiamiento 9/9, eventos 12/12, base 10/10.
  · **Conversions API (servidor):** la web ya deja listo el `_event_id` y las cookies;
    UCallNow implementa el POST server-side en n8n. Spec: `docs/meta-capi-lead-servidor.md`.
- El sitio NO tiene CSP → carga sin bloqueos. Si se agrega CSP: permitir
  `connect.facebook.net` (script) y `www.facebook.com` (img/connect).
- Los datos se ven en **Meta Events Manager**, NO en `/admin/analytics.html`
  (sistemas separados). Notas de qué significa cada dato: `docs/meta-pixel-eventos.md`.

## Datos clave
- Panel admin: el correo del usuario de login (Supabase Auth) es FICTICIO y por
  pedido del cliente (ago 2026) NO debe aparecer en NINGÚN lado — ni escrito en
  código/docs ni mostrado en pantalla. Las 4 páginas del panel pintan "Admin"
  fijo en el topbar en vez de `user.email`; docs sin ejemplos con ese correo.
  Solo se teclea al hacer login. Páginas admin nuevas: misma regla.
- Leads: Supabase `promax_inquiries` + webhook n8n (UCallNow) → WhatsApp
  13056761259 + email. El front SIEMPRE manda nombre+teléfono (captura modal
  `PMX.captureThenWhatsApp` en site.js).
- Verificación: usar Playwright local (chromium en /opt/pw-browsers) con el CDN
  mockeado + auditoría de URLs externas con curl (el Chromium del sandbox no
  tiene salida a internet; curl sí, vía proxy).
