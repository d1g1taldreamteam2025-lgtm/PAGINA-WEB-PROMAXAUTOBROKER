# Promax Auto Broker — Sitio Web

Sitio web bilingüe (Español / Inglés) para **Promax Auto Broker**, construido como **HTML + CSS + JS estático** (sin framework, sin build). Se hospeda en cualquier lado (GitHub Pages, Netlify, Vercel o hosting propio).

> Tomamos como referencia la web de Family Key Auto Group y la rehicimos para Promax, mejorando la arquitectura: **el header, footer y widgets se generan desde un solo lugar**, así que rebrandear es cambiar 1–2 archivos.

---

## 🚗 Páginas

| Ruta | Página |
|------|--------|
| `/` | Inicio |
| `/inventory/` | Inventario (filtros, búsqueda, orden, paginación) |
| `/vehicle/?id=...` | Detalle de vehículo |
| `/financing/` | Financiamiento (resumen) |
| `/financing/apply/` | Aplicar a financiamiento (formulario) |
| `/about/` | Nosotros |
| `/contact/` | Contacto (formulario + mapa) |
| `/faqs/` | Preguntas frecuentes |
| `/referrals/` | **Referidos (INTERNO, con clave)** → sincroniza a Google Sheet |
| `/privacy/` `/terms/` `/sitemap/` `/accessibility/` | Legales |

---

## 🛠️ Cómo trabajarlo

### 1. Rebrandear (datos de la marca)
Edita **`assets/js/config.js`** — es la única fuente de verdad: nombre, teléfono, WhatsApp, email, dirección, horarios, redes sociales, idioma, etc. Cambias ahí y se actualiza en toda la web.

### 2. Cambiar colores / estilo
Edita las variables de `:root` al inicio de **`assets/css/theme.css`**. Por ejemplo el color principal:
```css
--brand: #E11D2A;   /* cámbialo por el color de Promax */
```

### 3. Logo y favicon
Reemplaza estos archivos por los reales (mismos nombres):
- `assets/img/logo.svg` (fondo claro)
- `assets/img/logo-white.svg` (fondo oscuro / footer)
- `assets/img/favicon.svg`

### 4. Inventario
Por defecto el inventario se lee de **`assets/data/inventory.json`** (fácil de editar a mano). Cada vehículo tiene: `year, make, model, trim, body_type, price, msrp, mileage, fuel, transmission, drivetrain, cover_image, gallery, features, description, featured`, etc.

¿Tienen ya un sistema/CRM con el inventario? En `config.js` cambia `inventorySource` a `"api"` y pon `inventoryApiUrl` (formato tipo Supabase/REST).

### 5. A dónde llegan los leads (financiamiento, contacto, newsletter)
En `config.js` pon la URL de tu webhook en `endpoints.leadsWebhook` (n8n, Zapier, Make, etc.). Si lo dejas vacío, los formularios **simulan** el envío (se ven en la consola del navegador) — útil para probar.

---

## 🎁 Sección de Referidos + Sorteo (Google Sheet)

La página `/referrals/` es **interna** (protegida con una clave configurable). El equipo registra cada referido/venta y todo se guarda en una **Hoja de Google**. Una barra muestra el progreso hacia la meta (ej. 100 ventas) y al alcanzarla se habilita el **sorteo** (elige un ganador al azar entre las ventas).

### Configurarlo (≈5 minutos)
1. Crea una hoja en Google Sheets → [sheets.new](https://sheets.new).
2. Menú **Extensiones → Apps Script**.
3. Borra todo y pega el contenido de **`google-apps-script/Code.gs`**.
4. Cambia `TOKEN` (en Code.gs) por una clave secreta.
5. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la **URL del Web App**.
7. En `config.js`:
   - `endpoints.referralsScriptUrl` = la URL del Web App
   - `endpoints.referralsToken` = el **mismo** TOKEN del paso 4
   - `referrals.passcode` = clave para entrar a la página `/referrals/`
   - `referrals.goal` = meta de ventas para el sorteo (ej. 100)

Listo: el formulario interno escribe en la hoja y el contador/sorteo funcionan solos.

> El acceso por clave de `/referrals/` evita visitas casuales, pero **no es seguridad fuerte**. Comparte la URL solo con el equipo.

---

## 🚀 Desplegar

> El sitio usa rutas absolutas (`/assets/...`, `/inventory/...`), por lo que se sirve desde la **raíz del dominio**. **Vercel, Netlify y Hostinger funcionan tal cual** (GitHub Pages solo si es con dominio propio).

### Opción A — Vercel (recomendada, deploy en tiempo real) ⚡
1. Entra a [vercel.com](https://vercel.com) → **Add New → Project** → importa este repo de GitHub.
2. Framework: **Other** · Build: **vacío** · Output: **vacío** (es estático, no hay build).
3. Deploy. Te da una URL `*.vercel.app` y **cada push vuelve a desplegar solo** (cada rama/PR genera además su propia URL de *preview*).
4. **Dominio:** Project → **Settings → Domains** → agrega `promaxautobroker.com` cuando lo tengan (apuntas el DNS y listo, se cambia cuando quieras).

> Para que la rama de trabajo sea la "producción", en Vercel: Settings → Git → Production Branch.

### Opción B — Hostinger 🟣
**Manual (rápido):** descarga el repo, y en hPanel → **Administrador de archivos** sube **todo el contenido** a `public_html/` (es la raíz del dominio). Para actualizar, vuelves a subir los archivos cambiados.

**Automático (en cada push):** ya hay un workflow en `.github/workflows/deploy-hostinger.yml`. Actívalo así:
- En GitHub → **Settings → Secrets and variables → Actions**:
  - **Variables:** `HOSTINGER_ENABLED = true` (y opcional `FTP_SERVER_DIR`, por defecto `public_html/`).
  - **Secrets:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (los obtienes en hPanel → Archivos → **Cuentas FTP**).
- Con eso, cada push a `main` sube el sitio a tu Hostinger automáticamente.

### Opción C — GitHub Pages (incluida)
Workflow en `.github/workflows/deploy.yml`. En el repo: **Settings → Pages → Source: GitHub Actions**. Requiere **dominio propio** para verse bien (si no, queda en un subpath y las rutas absolutas fallan).

---

## 📁 Estructura

```
.
├── index.html                  # Inicio
├── inventory/  vehicle/  financing/  financing/apply/
├── about/  contact/  faqs/  referrals/
├── privacy/ terms/ sitemap/ accessibility/
├── assets/
│   ├── css/theme.css           # Sistema de diseño (variables = rebrand)
│   ├── js/
│   │   ├── config.js           # ⭐ Datos de la marca (editar aquí)
│   │   ├── site.js             # Header/footer/widgets + idioma
│   │   ├── data.js             # Cargador de inventario
│   │   ├── inventory.js        # Lógica de filtros del inventario
│   │   └── referrals.js        # Cliente de referidos (JSONP)
│   ├── data/inventory.json     # Inventario de muestra (editable)
│   └── img/                    # logo, favicon (reemplazar)
├── google-apps-script/Code.gs  # Backend de referidos (Google Sheet)
├── docs/PREGUNTAS-CLIENTE.md   # ⭐ Preguntas para cerrar con el cliente
└── .github/workflows/deploy.yml
```

---

## ✅ Pendiente del cliente
Todo lo que falta por confirmar (logo, colores, teléfono, dirección, reglas del sorteo, etc.) está consolidado en **[`docs/PREGUNTAS-CLIENTE.md`](docs/PREGUNTAS-CLIENTE.md)** — una sola lista para enviar a Promax y dejar la web 100% lista.
