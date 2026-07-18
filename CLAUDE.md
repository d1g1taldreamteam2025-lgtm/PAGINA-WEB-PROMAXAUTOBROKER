# Promax Auto Broker — Guía del proyecto

## 🚫 REGLA DE ORO: NO depender de Cloudinary (pedido de Jorge, jul 2026)

La cuenta de Cloudinary `drbc4wbvw` quedó SUSPENDIDA (HTTP 401 en TODO su
contenido) y rompió media web de un día para otro: logos, banners de
referidos/precalifica/importación, popup 15% OFF, videos y logos de bancos.
No hubo forma de recuperar los archivos (Wayback tampoco los tenía).

**Política desde entonces:**
1. TODO asset nuevo (logos, banners, flyers, íconos) se guarda **en este repo**
   (`/assets/img/...`) o en **Supabase Storage** — nunca en Cloudinary.
2. Nada del layout crítico (header, footer, heros, secciones) puede apuntar a
   `res.cloudinary.com`. Si un asset llega por Cloudinary, descargarlo y
   alojarlo local antes de referenciarlo.
3. La cuenta `kcixfvoq` sigue viva y aún sirve: heros de páginas (auction,
   carfax, faqs, contact, about, home, inventory), fotos móviles y 8 videos de
   `assets/data/instagram.json`. **Migrarlos a Supabase Storage cuando se pueda**
   (Jorge: "todo de Supabase próximamente").
4. Los thumbs del catálogo usan Cloudinary **fetch** (`/image/fetch/`) solo como
   proxy de optimización sobre URLs de dealers — si falla, el sitio cae a la URL
   original del dealer (patrón ya implementado en data.js). Ese uso es tolerable
   hasta migrar.

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

⚠️ El uploader del panel admin (`admin/index.html`, `CLOUDINARY_CLOUD_NAME`)
apunta a la cuenta muerta: subir fotos desde el admin FALLA hasta apuntarlo a
otra cuenta o (mejor) a Supabase Storage.

## Datos clave
- Leads: Supabase `promax_inquiries` + webhook n8n (UCallNow) → WhatsApp
  13056761259 + email. El front SIEMPRE manda nombre+teléfono (captura modal
  `PMX.captureThenWhatsApp` en site.js).
- Verificación: usar Playwright local (chromium en /opt/pw-browsers) con el CDN
  mockeado + auditoría de URLs externas con curl (el Chromium del sandbox no
  tiene salida a internet; curl sí, vía proxy).
