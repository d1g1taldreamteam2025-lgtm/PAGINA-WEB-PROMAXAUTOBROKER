# ProMax Auto Broker — Sitio Web

Sitio web profesional para **ProMax Auto Broker** (Joel Jordá · Miami, FL).
Auto Broker USA · Chutos y Camiones · Importación y Logística a Venezuela.

Sitio estático (HTML + CSS + JS) — sin servidor, sin build. Listo para
**GitHub Pages**, **Netlify** o **Vercel**. Bilingüe **Español / Inglés**.

---

## 🚀 Cómo verlo localmente (VS Code)

El sitio usa rutas absolutas (`/inventario/`, etc.) y carga datos con `fetch`,
así que **debe servirse por HTTP** (no abrir el `.html` con doble clic).

**Opción A — Extensión Live Server (recomendada):**
1. Instala la extensión **Live Server** en VS Code.
2. Clic derecho en `index.html` → **Open with Live Server**.

**Opción B — Python:**
```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

---

## 📁 Estructura

```
/
├── index.html              Inicio
├── inventario/             Inventario con filtros
├── importacion/            Proceso de importación USA→Venezuela
├── financiamiento/         Financiamiento + pre-calificación rápida
│   └── aplicar/            Solicitud de crédito completa
├── nosotros/  contacto/  faqs/
├── referidos/              Panel INTERNO (con clave) → Google Sheets
├── privacidad/  terminos/  404.html
├── assets/
│   ├── css/styles.css      Diseño (colores en variables :root)
│   ├── js/
│   │   ├── config.js       ⭐ DATOS DEL NEGOCIO (editar aquí)
│   │   ├── i18n.js         Motor de traducción ES/EN
│   │   ├── components.js   Header, footer, marquee, WhatsApp
│   │   ├── inventory.js    Carga y filtra el inventario
│   │   ├── forms.js        Formularios de leads → Google Sheets
│   │   └── referidos.js    Panel de referidos + progreso del sorteo
│   ├── data/inventory.json ⭐ VEHÍCULOS (editar aquí)
│   └── img/favicon.svg
└── google-apps-script/Code.gs   Backend de Google Sheets
```

---

## ✏️ Editar contenido (lo más común)

### 1) Datos del negocio → `assets/js/config.js`
Teléfono, WhatsApp, email, redes, horario, clave de referidos y la URL del
backend. **Todo el sitio lee de este archivo.**

### 2) Vehículos → `assets/data/inventory.json`
Cada vehículo es un objeto. Campos clave:
- `type`: `auto` · `suv` · `camioneta` · `chuto` · `van` · `moto`
- `condition`: `new` o `used`
- `priceUnit`: `total` (precio total, ej. usados) o `month` (mensualidad, ej. Toyota nuevos)
- `image`: URL de la foto. **Si lo dejas vacío** se muestra un ícono de respaldo.
- `featured`: `true` para que salga en el carrusel del inicio.

### 3) Logo e imágenes
- El logo actual es de **texto** ("PROMAX"). Para usar el logo real:
  sube el archivo a `assets/img/logo.svg` (o `.png`) y avísame para enlazarlo,
  o reemplázalo en `components.js` (buscar `pm-logo`).
- Para fotos de vehículos: pon las URLs en `inventory.json` (campo `image`).
  Recomendado: subirlas a [Cloudinary](https://cloudinary.com) (gratis) o a
  `assets/img/` y usar la ruta `/assets/img/archivo.jpg`.

### 4) Colores del tema
En `assets/css/styles.css`, bloque `:root`. El acento naranja es `--pm-orange`.

---

## 🔗 Conectar Google Sheets (Referidos + Leads)

Los formularios (referidos, financiamiento, contacto) guardan los datos en una
**Google Sheet** mediante **Google Apps Script** (gratis, sin servidor).

1. Crea una **Google Sheet** nueva en la cuenta de Google de ProMax.
2. Menú **Extensiones → Apps Script**. Borra todo y pega el contenido de
   `google-apps-script/Code.gs`. Guarda.
3. **Implementar → Nueva implementación → Aplicación web.**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** ← importante
4. Autoriza con tu cuenta y copia la **URL** que termina en `/exec`.
5. Pégala en `assets/js/config.js`:
   ```js
   appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. Listo. Se crean solas dos pestañas: **Referidos** y **Leads**.

> Mientras `appsScriptUrl` esté vacío, los formularios funcionan en **modo demo**
> (validan y muestran éxito, pero no guardan nada).

### Sorteo de las 100 ventas
- En la pestaña **Referidos**, la columna **Estatus** controla el conteo.
- Escribe **`vendido`** en esa columna cuando un referido se convierta en venta.
- La barra de progreso del panel `/referidos/` se actualiza sola (X / 100).
- La meta (100) se ajusta en `config.js` (`referralGoal`) **y** en `Code.gs` (`META_GOAL`).

### Panel de referidos (interno)
- URL: `/referidos/` — protegido por una **clave** (`referralPasscode` en `config.js`).
- Valor por defecto: `PROMAX2026` (cámbialo).
- Nota: es una barrera básica del lado del cliente, no seguridad de nivel bancario.

---

## 🌐 Publicar (deploy)

### GitHub Pages
1. Sube el repo a GitHub (ya incluye `.nojekyll` para que funcionen las carpetas).
2. Repo → **Settings → Pages** → Source: rama `main` (o la que uses), carpeta `/root`.
3. Para dominio propio: agrega un archivo `CNAME` con tu dominio y configura el DNS.

> Las rutas son absolutas (`/inventario/`). Funcionan en dominio propio o en la
> raíz del sitio. Si usas una URL tipo `usuario.github.io/repo/`, conviene usar
> dominio propio para que los enlaces no se rompan.

### Netlify / Vercel (alternativa fácil)
Arrastra la carpeta o conecta el repo. No requiere configuración.

---

## 🌎 Bilingüe ES / EN
- El idioma por defecto es **Español** (`config.js → defaultLang`).
- El HTML está en español; las traducciones al inglés viven en cada página
  (`PROMAX_I18N.add({ en: {...} })`) y en `i18n.js` (textos compartidos).
- El selector ES/EN está en la barra superior y se recuerda en el navegador.

---

## ✅ Pendiente (lo que falta para quedar 100% en producción)
- [ ] Conectar `appsScriptUrl` (Google Sheets) — ver arriba.
- [ ] Cargar logo real y fotos de vehículos.
- [ ] Confirmar datos finales en `config.js` (email, Facebook, horario, etc.).
- [ ] Revisar `privacidad/` y `terminos/` con un asesor legal.
- [ ] Definir dominio y publicar.
