# Sistema de inventario Promax — Documentación COMPLETA (robot + bookmarklets)

> **Para quién es esto:** cualquier desarrollador (o chat de Claude) que llegue de cero
> y necesite entender, mantener o RETOMAR el proyecto de sincronización de inventario.
> Aquí está TODO: la arquitectura, cada componente, las fallas que ya nos comimos y
> sus soluciones, las decisiones del cliente y cómo continuar la parte pausada.
>
> Última actualización: 2026-07-12 · Estado: **manual ACTIVO · sincronización total EN PAUSA**

---

## 1. Resumen ejecutivo

- La web (estática, Vercel) muestra el inventario desde **Supabase self-hosted**
  (`db.ucallnow.fun`, tabla `promax_inventory`) usando la **anon key** (solo lectura).
- El inventario entra por DOS vías:
  1. **Robot semanal** (GitHub Actions + Playwright): scrapea los dealers de
     `tools/auto-sync/dealers.json` y sube con permisos de escritura. Corre solo.
  2. **Bookmarklets manuales** (en `/admin/` → "Instala los bookmarklets"): el dueño
     los abre EN el sitio del dealer desde SU navegador (pasa cualquier antibot,
     porque es un usuario real) y pega el lote en el panel.
- **Decisión del cliente (jul 2026):** la "Fase 3" (sincronización TOTAL automática
  desde el navegador, botones 🚀 LOTE TODO y 🔄 Sync TODO → Panel) queda **EN PAUSA**.
  El flujo oficial es: robot semanal + bookmarklets manuales por página.
- **Decisión del cliente final (Joel):** solo se publican vehículos de dealers con los
  que él tiene trato: **HGreg Trucks (camiones), AutoDeal Miami, International Cars USA,
  Toyota of North Miami** (+ Motoport que pidió el intermediario). Los ~3,000 carros de
  hgreg.com se ELIMINARON y la fuente quedó retirada (`RETIRED_SOURCES` en sync.js).

## 2. Arquitectura

```
DEALERS (webs)                    GitHub Actions (lunes 10:00 UTC + push a tools/auto-sync/**)
  hgregtrucks.com  ──┐             ┌──────────────────────────────────────────┐
  motoportusa.com  ──┼── robot ──► │ sync.js (Playwright headful + xvfb)      │
  autodealmiami    ──┤  (bloqueado │  1) purgeRetiredSources / fixBadMsrp /   │
  internationalcars┘   Cloudflare) │     fillMissingBodyType  (limpieza)      │
                                   │  2) por dealer: engine.js en el browser  │
  navegador del DUEÑO              │  3) enrichPhotos (fichas → hasta 24 fotos)│
  (bookmarklets /admin/) ────────► │  4) upsert + cleanupStale + sitemap      │
                                   └───────────────┬──────────────────────────┘
                                                   ▼
                       Supabase self-hosted: db.ucallnow.fun (PostgREST)
                        tabla promax_inventory  (escritura: service key o login admin)
                                                   ▼
              Web (Vercel): assets/js/data.js  →  SLIM + filtro 4+ fotos (gallery->3)
              Panel /admin/: CRUD manual + Importar lote (pegar JSON del bookmarklet)
```

## 3. Archivos clave

| Archivo | Rol |
|---|---|
| `tools/auto-sync/engine.js` | **EL MOTOR** (fuente de la verdad). Extractor universal: detección de tarjetas, fotos, categorías, condición, normalización a filas de la tabla. Corre en el navegador (robot Y bookmarklets). |
| `tools/auto-sync/sync.js` | Orquestador del robot: Playwright, anti-Cloudflare, fotos, subida, limpiezas, sitemap. |
| `tools/auto-sync/dealers.json` | Lista de dealers del robot (`name,url,source,minYear,isTrucks,isPower`). Quitar un dealer + agregarlo a `RETIRED_SOURCES` en sync.js = sus filas se borran solas en la próxima corrida. |
| `.github/workflows/inventory-sync.yml` | El workflow (cron lunes + push + manual). Env: `PROMAX_HEADFUL=1`, `PROMAX_PHOTO_CONC=14`, `PROMAX_PHOTO_BUDGET_MS=2700000`. Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (o `PROMAX_ADMIN_EMAIL/PASSWORD`). |
| `admin/index.html` | Panel + bookmarklets. Los hrefs `BOOKMARKLET_UNIV_HREF` y `BOOKMARKLET_SYNC_HREF` llevan EMBEBIDA una copia minificada del motor. **No editarlos a mano**: regenerarlos con el script de abajo. |
| `tools/auto-sync/build-bookmarklets.js` | Regenera esas copias embebidas desde engine.js (tokenizer que quita comentarios y respeta strings/regex). Correr con node tras cada cambio del motor. |
| `tools/auto-sync/tests/` | Suites Playwright con FIXTURES de cada plataforma de dealer (no requieren internet). Correr: `node tests/test-universal.js` etc. |
| `assets/js/data.js` | Lado web: SLIM (campos livianos), filtro **mínimo 4 fotos** (`gallery->3=not.is.null`), condición año-primero, inferencia de carrocería, msrp>2x oculto, placeholder SVG. |

## 4. Base de datos

Tabla **`promax_inventory`** (campos que escribe `promaxToDb`):
`id` (slug estable o VIN en minúscula — clave del upsert), `stock`, `vin`, `year`, `make`,
`model`, `trim`, `category` (`cars|trucks_machinery|vans|motorcycles|utv|watercraft`),
`body_type`, `price`, `msrp`, `mileage`, `fuel`, `transmission`, `drivetrain`,
`exterior_color`, `interior_color`, `badge`, `featured`, `cover_image`, `gallery` (jsonb
array, hasta 24 — mín. 4 para aparecer en la web), `features` (jsonb), `description`, `status` (`available|Vendido`),
`source` (ej. `hgregtrucks.com`; **null = carga manual, NUNCA se toca automático**),
`source_url` (ficha original), `last_sync` (sello ISO de la corrida).

Otras tablas: `promax_inquiries` (leads), `promax_settings` (key `raffle`: goal/sold),
`promax_analytics` (visitas/clics).

Reglas de acceso: **anon key = SOLO lectura** (va en `assets/js/config.js`, es pública).
Escritura: `service_role` key (secret de Actions) o sesión del usuario admin
(login del panel — rol authenticated pasa RLS).

PostgREST — trucos que usamos (y los que nos quemaron):
- Conteo: `Prefer: count=exact` puede dar TIMEOUT en tablas grandes → usar `count=planned`.
- Filtro "4+ fotos": `gallery->3=not.is.null` (existe el 4º elemento del array).
- Borrado por fuente: `DELETE ?source=eq.hgreg.com`.
- Upsert: `POST ?on_conflict=id` + `Prefer: resolution=merge-duplicates`.
- Batch por ids: `PATCH ?id=in.("a","b",...)` (ids saneados, sin comas/comillas).

## 5. El motor (engine.js) — cómo detecta y qué aprendimos

**Detección de tarjetas (listado):**
1. Prueba selectores conocidos y se queda con el que dé MÁS tarjetas válidas
   (`cardish`): `[itemtype*="Vehicle"]` (hgreg/hgregtrucks), `[data-vin]`
   (DealerCenter → AutoDeal Miami), `article` (Motoport/DX1), clases `vehicle-card`…
2. Si salen <3: **rescate por VIN** — recorre `div,li,article,tr,section` buscando texto
   con UN VIN de 17 y un `$` (International Cars USA / eBizAutos se detecta así,
   probado con fixture en `tests/test-international.js`).
3. `growCard()`: si el ancla es chiquita (p.ej. un botón con `data-vin`), sube por el DOM
   hasta el contenedor real con año + datos (clave en DealerCenter).

**Fotos:** primero `data-src/data-original/data-lazy/srcset` (el `src` suele ser un
placeholder por lazy-load → si no, salen fotos negras), luego `style*=background-image`;
se descartan logos/badges/carfax (`badImg`). En la FICHA (`promaxDetailMedia`):
JSON-LD → og:image → zonas de galería → enlaces a .jpg → todas las <img>, con:
- `vehKey`/grupo dominante: si la galería mezcla varios carros (miniaturas de "similares"),
  se queda con el grupo del MISMO vehículo (nos pasó: fotos de un Subaru en un Sentra).
- `baseKey`: dedup de la misma foto en distintos tamaños (`-640px`, `_480px`, sufijos).
- `qscore`: entre variantes de la MISMA foto gana la de mayor resolución declarada
  (o la original sin marcador de tamaño). Antes ganaba "la primera vista" → miniaturas.
- **`promaxUpsize` (12-jul-2026)**: DealerCenter lleva el TAMAÑO en la RUTA —
  `imagescf.dealercenter.net/279/208/foto.jpg` es una CAJA de 279×208 px (¡no un id!).
  El dealer pide miniaturas y esa URL chiquita era la que subíamos → fotos pixeladas
  en International aunque trajéramos "todas". El CDN redimensiona al vuelo (verificado
  en vivo: `/1280/960/` responde la misma foto en 1280×960 reales; `/0/0/` es el
  original 2048×1536 pero pesa ~600KB). Se normaliza SIEMPRE a `/1280/960/` en
  `images()` (tarjeta) y `promaxDetailMedia.add()` (ficha). Fixture en
  `tests/test-photoquality.js`.
- Acepta URLs protocol-relative (`//cdpcdn.dx1app.com/...`) — Motoport las usa.
- **Conteo transparente**: `promaxExtract` cuenta los descartados por la regla de año
  (2020+ / 2022+ camiones) en `rows.skippedYear`, y `promaxRunAll` lo dice al final
  ("Nota: N descartado(s) por AÑO…"). Resuelve el "la Prueba dice 10 y el Universal
  trae 9": la Prueba cuenta TARJETAS crudas; el Universal aplica la regla de año
  (p.ej. una F-250 2019 se descarta a propósito).

**Condición (regla del negocio, NO del dealer):** año >= año en curso y millaje < 30,000
⇒ `new`, aunque el dealer diga "used" (los dealers marcan "usado" cualquier 0-millas).
*Falla histórica:* `has(U,'USED')` en el texto pisaba esta regla y dejó los 2026 como
usados (NUEVOS = 0 en la web). El orden correcto es AÑO PRIMERO.

**Categorías:** `isTrucks` (hgregtrucks) fuerza `trucks_machinery`; `isPower` (Motoport)
mapea jet ski/UTV/motos por palabras; el resto: vans por body, marcas de camión
(Peterbilt/Kenworth/…) a camiones, default `cars`.

## 6. El robot (sync.js) — flujo y fallas resueltas

Flujo de una corrida: `resolveAuth` → **limpiezas** (`purgeRetiredSources` → borra
fuentes retiradas; `fixBadMsrp` → `msrp=null` si `msrp > 2×price` — los "precio anterior
$470,000" tachados; `fillMissingBodyType` → infiere carrocería por modelo, SOLO
`cars/vans`, para que "Toyota + Camionetas" no dé 0; `fixDealercenterThumbs` →
reescribe galerías ya guardadas con miniaturas DealerCenter `/W/H/` a `/1280/960/`,
sana lo importado por bookmarklets viejos) → por cada dealer: abrir listado
en Chromium **headful bajo xvfb**, esperar el challenge de Cloudflare (título
"Just a moment…" hasta 45s, 1 recarga), inyectar engine, recorrer páginas, entrar a
fichas por fotos (`enrichPhotos`) → re-login → `upsert` (lotes de 100) →
`cleanupStale` (lo no visto en esta corrida se borra: catálogo 100% fresco) →
sitemap-vehicles.xml + commit del robot.

**Historia de fallas (para no repetirlas):**

| Falla | Causa | Solución |
|---|---|---|
| Cloudflare bloquea AutoDeal/International en Actions | IP de datacenter | Sin solución server-side fiable. Headful+xvfb arregló HGreg; para estos dos: **bookmarklets manuales** (elegido) o proxy residencial de pago (sin garantía). |
| "JWT expired" al subir | las fotos tardan >1h y el token de admin vence | `resolveAuth()` de nuevo JUSTO antes del upsert |
| Fotos negras | lazy-load: el src real está en `data-src` | leer data-src/srcset primero |
| Fotos de OTRO carro | galería de la ficha mezcla "similares" | grupo dominante por `vehKey` |
| Jet skis con 1 foto | `waitUntil:'commit'` corta antes de pintar la galería + URLs `//cdpcdn` que el regex no aceptaba | reintento a 1.5s + **fetch-fallback**: `fetch(location.href)` + `DOMParser` (el HTML crudo trae TODA la galería estática) + regex protocol-relative |
| Cobertura HGreg cayó (1071 con ≤1 foto) | hicimos la espera más lenta (domcontentloaded+6s) y el presupuesto no alcanzó para ~3000 fichas | volver a `commit`+waitForSelector(4s), `PROMAX_PHOTO_CONC=14`, presupuesto 45 min → 97% con 4+ fotos |
| `count=exact` timeout | count caro en PostgREST | `Prefer: count=planned` |
| Ficha "vehicle not found" | id con `+` sin encodear en la URL | `encodeURIComponent` en todos los links |
| 2026 aparecían como usados | `has(U,'USED')` del texto del dealer | condición AÑO PRIMERO (ver §5) |
| MSRP $205,500 en un Camry de $21,895 | import corrupto (Toyota NM) | `fixBadMsrp` (robot) + web oculta msrp>2×price |
| Fotos PIXELADAS de International (todas) | DealerCenter pone el tamaño EN LA RUTA (`/279/208/` = caja 279×208) y el dealer pide miniaturas; ni `baseKey` ni `qscore` veían ese patrón | `promaxUpsize` normaliza a `/1280/960/` (motor) + `fixDealercenterThumbs` (robot, sana la base) — verificado en vivo que el CDN sirve esa caja |

## 7. Bookmarklets (flujo manual ACTIVO)

En `/admin/` → "Instala los bookmarklets". Roles:

| Botón | Uso |
|---|---|
| 🧪 Prueba Promax | PRIMERO en cada dealer nuevo: dice cuántas tarjetas ve. Si no sale nada, el dealer bloquea bookmarklets (usar método por consola). |
| 🔎 Diagnóstico | reporte de selectores/estado (lo que el dueño pega en el chat para que ajustemos el motor). |
| 📥 Extract Promax JSON | **1 a 1, SOLO Dealer.com**: en la FICHA de un vehículo → copia ese carro con TODAS sus fotos → panel → Agregar Vehículo → Pegar JSON. En otros dealers su error ya lo dice: usar el 🌐 Universal dentro de la ficha (funciona con 1 tarjeta). |
| 📦 Extract LOTE Promax | UNA página del listado (rápido, sin entrar a fichas). |
| 🌐 LOTE Universal | **la joya para el flujo manual**: una página del listado (o UNA ficha) + entra a cada ficha por TODAS sus fotos (hasta 24, en alta) + filtra año + categoría → copia → panel → "Importar lote". Sirve en hgregtrucks, Motoport, AutoDeal, International. Para el LOTE COMPLETO: repetir por cada página del listado. |
| 🚀 LOTE TODO · EN PAUSA | recorre TODAS las páginas de un clic (experimental). |
| 🔄 Sync TODO → Panel (Fase 3) · EN PAUSA | igual + sube directo a Supabase + marca vendidos. Funciona, pero el cliente decidió pausarlo. |

**Los 4 dealers del flujo manual y cómo los ve el motor** (diagnósticos reales del dueño, jul 2026):
- `motoportusa.com` → tarjetas `article` (24 en la lista; 1 en ficha) ✓
- `hgregtrucks.com` → `[itemtype*=Vehicle]` en lista; `[data-vin]` en ficha ✓
- `autodealmiami.net` → `[data-vin]` (72 en lista; 5 en ficha, se deduplican) ✓ *(Cloudflare NO molesta en navegador real)*
- `internationalcarsusa.com` → sin selectores conocidos ⇒ **rescate por VIN** (texto VIN+precio) ✓ probado con fixture

**Versiones VISIBLES (a pedido del dueño, 12-jul-2026):** cada botón lleva su
versión en el NOMBRE (queda como nombre del marcador al arrastrarlo) y debajo
un sello `build #xxxxxx` = hash del código real (cambia solo en cada build).
Las alertas también imprimen la versión. Así una captura de pantalla demuestra
exactamente qué versión corrió — sin discusiones de "arrastré el viejo".

| Botón | Versión actual | Alcance |
|---|---|---|
| 📥 Extract Promax JSON | **v3.1** | ficha de UN vehículo, **solo Dealer.com** (fuera de ahí, su error manda al 🌐) |
| 📦 Extract LOTE | v4 | **solo Dealer.com** (su alerta lo dice) |
| 🔎 Diagnóstico | v1 | reporte de selectores |
| 🚀 LOTE TODO | v1 | Dealer.com, todas las páginas · EN PAUSA |
| 🧪 Prueba Promax | **v2.0 universal** | mismos detectores del motor (antes v1 solo Dealer.com — por eso daba "0" en International). OJO: cuenta tarjetas CRUDAS, sin filtro de año. |
| 🌐 LOTE Universal | **v2.2** | todos los dealers, TODAS las fotos (hasta 24) en ALTA (DealerCenter reescrito a 1280×960) + reporta "N descartados por año" (explica el 10 vs 9 contra la Prueba) |
| 🔄 Sync TODO → Panel | v3.1 · EN PAUSA | igual + sube directo |

**Regenerar los bookmarklets tras tocar engine.js:**
```bash
node tools/auto-sync/build-bookmarklets.js   # valida sintaxis y reemplaza los String.raw del admin
node tools/auto-sync/tests/test-universal.js # 45 checks de fixtures (requiere Playwright)
```
⚠️ Trampa aprendida: al reconstruir con `String.replace` de JS, el texto nuevo contiene
`$` → se interpreta como patrón (`$&`, `$'`) y CORROMPE el archivo. Usar función como
reemplazo: `s.replace(x, () => nuevo)`. El build script ya lo hace bien.

## 8. Cómo RETOMAR la Fase 3 (sincronización total) cuando la pidan

Estado: **funcional** (botón 🔄 en el admin) pero pausado por decisión comercial.
1. Quitar las etiquetas "EN PAUSA" del modal del admin.
2. El botón ya: recorre todas las páginas, saca fotos, sube directo (usa la sesión del
   admin logueado — `__SUPA_URL__` se reemplaza al montar el modal), y marca vendidos.
3. Mejoras sugeridas si se retoma: barra de progreso por página, reintentos por ficha,
   límite de tiempo configurable, y modo "solo nuevos" (diff contra `last_sync`).
4. Vender el servicio a otros: el motor es genérico (5 plataformas probadas con
   fixtures); para un dealer nuevo → correr 🧪 y 🔎, y si no lo ve, agregar selector
   o confiar en el rescate por VIN.

## 9. Pendientes conocidos (a la fecha)

- **Toyota of North Miami al robot**: hoy son ~262 filas manuales (`source=null`).
  Es plataforma **Dealer.com**: el listado trae un blob `ws-inv-data` (JSON) con todo
  el inventario — hay que parsearlo (task pendiente). Mientras, se actualiza a mano.
- **AutoDeal / International en el robot**: bloqueados por Cloudflare en Actions;
  siguen en dealers.json por si algún día pasan; el flujo real es manual.
- **Yamaha/Suzuki/Kawasaki**: sin dealer fuente todavía (el cliente debe indicar cuál).
- Las 3 motos de Motoport tienen 1 foto en la base → la web las oculta (regla 4+ fotos).
- La web exige **mínimo 4 fotos** para listar (`data.js`); la ficha directa por URL
  sí abre con menos.

## 10. Pruebas

`tools/auto-sync/tests/` (Playwright; usan FIXTURES locales, no tocan internet):
- `test-universal.js` — 45 checks: hgreg (microdata), hgregtrucks, DealerCenter
  (`data-vin` + growCard), Dealer Spike, Motoport/DX1; dedup por VIN; años; categorías.
- `test-international.js` — 10 checks: rescate por VIN (eBizAutos) en el motor real
  Y en el minificado de los bookmarklets.
- `test-photoquality.js` — 23 checks: gana la variante GRANDE de cada foto (no la
  miniatura), no se recorta en 5, y DealerCenter (`/W/H/` en la ruta) se normaliza a
  `/1280/960/` en forma plana y con carpeta, sin duplicar y sin tocar otros hosts.
- `test-inferbody.js` — mapa de carrocerías por modelo (Tacoma=camioneta, Savana=van…).
- En CI/local: levantar `python3 -m http.server 8099` en la raíz para las suites de la
  web (catálogo/home) si se copian de la sesión.

Chromium local del entorno de desarrollo: `PROMAX_CHROMIUM=/ruta/chrome node sync.js`
(en Actions se instala con `npx playwright install chromium`).
