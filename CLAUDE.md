# Promax Auto Broker — Guía del proyecto

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
- Lógica centralizada en `/assets/js/meta-pixel.js` (init + `PageView`). Cada
  página PÚBLICA carga ese `<script>` en el `<head>` + un `<noscript>` de
  respaldo. Insertado en las 19 páginas públicas; **NO en `/admin/`** (para no
  ensuciar los datos con las visitas del panel del staff).
- El sitio NO tiene CSP → no hubo que autorizar dominios. Si algún día se agrega
  CSP, hay que permitir `connect.facebook.net` (script) y `www.facebook.com`
  (img/connect).
- Los datos se ven en **Meta Events Manager** (panel de Meta), NO en nuestro
  `/admin/analytics.html` (son sistemas separados). Pendiente/opcional: eventos
  avanzados (`Lead` al capturar nombre+teléfono, `ViewContent` en la ficha del
  carro) para optimizar anuncios — aún no implementados.

## Datos clave
- Leads: Supabase `promax_inquiries` + webhook n8n (UCallNow) → WhatsApp
  13056761259 + email. El front SIEMPRE manda nombre+teléfono (captura modal
  `PMX.captureThenWhatsApp` en site.js).
- Verificación: usar Playwright local (chromium en /opt/pw-browsers) con el CDN
  mockeado + auditoría de URLs externas con curl (el Chromium del sandbox no
  tiene salida a internet; curl sí, vía proxy).
