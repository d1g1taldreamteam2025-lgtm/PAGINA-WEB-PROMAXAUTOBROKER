# Scraper Dealer.com → inventario Promax

Saca el inventario de un concesionario montado en **Dealer.com** (ejemplo:
`toyotaofnorthmiami.com`) y lo deja en el **mismo formato JSON** que usa la web
de Promax (`assets/data/inventory.json`). Así, una vez tienes los carros, se
enchufan al sitio y se ven al instante con tus filtros, buscador y tarjetas.

---

## ¿De dónde sale la data? (la parte importante)

Cada página de carro de Dealer.com trae **el JSON metido adentro**, en un bloque:

```html
<script type="application/ld+json"> { ... datos del carro ... } </script>
```

Ahí viene todo: **año, marca, modelo, versión, precio, millaje, VIN**, motor,
transmisión, tracción, colores, foto y descripción. Las **fotos** viven en
`pictures.dealer.com` (un servidor de imágenes que **no tiene candado**, o sea,
se bajan directo).

⚠️ **El detalle:** la web del concesionario tiene un **guardia antibots**. Si la
abres en tu navegador, entras sin problema; pero si un programa “pelado” intenta
entrar desde un servidor, le responde **403 Forbidden**. Por eso este scraper
tiene dos modos: uno a prueba de balas (offline) y uno automático (con Chrome de
verdad, que sí pasa el guardia).

---

## Modo 1 — OFFLINE (recomendado, no necesitas instalar nada)

1. En **tu navegador**, abre las páginas de los carros que quieres (ahí sí entras).
2. Guárdalas con **Ctrl+S → “Página web, solo HTML”** dentro de la carpeta
   **`input/`** (o pega el código HTML en un archivo `.html` ahí dentro).
3. Corre:

   ```bash
   node scrape.js
   ```

4. Listo: se crea **`inventory.json`** con todos los carros.

> Solo necesitas tener **Node** instalado. Nada más.

---

## Modo 2 — LIVE (automático, pasa el antibot con Chrome real)

Necesita Playwright **una sola vez**:

```bash
npm install playwright
npx playwright install chromium
```

**Opción A — por lista de direcciones** (pega las URLs de los carros, una por línea,
en `urls.txt`):

```bash
node scrape.js --live --urls urls.txt
```

**Opción B — que él solo busque los carros** en una página de listado:

```bash
node scrape.js --live --srp "https://www.toyotaofnorthmiami.com/used-inventory/index.htm" --max 20
```

¿Te bloquea igual? Agrega **`--headful`** (abre un Chrome visible, que cuesta más
de detectar):

```bash
node scrape.js --live --srp "https://www.toyotaofnorthmiami.com/used-inventory/index.htm" --max 20 --headful
```

---

## Opciones

| Opción            | Qué hace                                                        |
|-------------------|-----------------------------------------------------------------|
| `--out archivo`   | Dónde guardar el resultado (por defecto `inventory.json`)        |
| `--input carpeta` | Carpeta con los HTML guardados (modo offline, por defecto `input/`) |
| `--live`          | Modo automático con Chrome real (Playwright)                     |
| `--urls archivo`  | Lista de URLs de carros (modo live)                             |
| `--srp "URL"`     | Página de listado de inventario (modo live)                    |
| `--max N`         | Cuántos carros tomar del listado (por defecto 20)              |
| `--headful`       | Abre Chrome visible (ayuda si el antibot bloquea)              |

---

## ¿Cómo se ve el resultado?

Mira **`inventory.sample.json`**: es un carro **real** ya sacado de su web
(Toyota Corolla Hatchback SE 2024, $27,018, 20 millas, con sus 23 fotos). Ese es
exactamente el formato que la web de Promax sabe leer.

---

## Siguiente paso: enchufarlo al demo

Cuando tengas el `inventory.json` con los ~20 carros, ese archivo se conecta al
sitio para mostrar el inventario de ellos con tu diseño. Eso es lo que les
enseñas para venderles. (Avísame y lo dejamos armado.)

> 💡 **Consejo para la venta:** cuando ellos digan que sí, lo más limpio es
> pedirles su **feed de inventario oficial** de Dealer.com (lo pueden activar):
> así no hay que pelear con el antibot nunca y el inventario se actualiza solo.
> El scraper es para el **demo** de entrada.
