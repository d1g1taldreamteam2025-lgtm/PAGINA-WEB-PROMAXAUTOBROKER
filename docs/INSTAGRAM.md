# Instagram en la web (sección Nosotros) — modo manual

La página **Nosotros** muestra una galería con tus reels. Al tocar una
tarjeta, abre el video directo en Instagram.

La lista vive en un solo archivo: **`assets/data/instagram.json`**.
Tú la editas cuando subes un reel nuevo. No necesitas cuentas, ni tokens,
ni servicios externos.

---

## Cómo agregar un reel (3 pasos)

### 1) Copia el enlace del reel en Instagram
- **En el celular:** abre el reel → botón de **compartir** (✈️ o el menú “⋯”)
  → **Copiar enlace**.
- **En la computadora:** abre el reel y copia la dirección de arriba
  (se ve así: `https://www.instagram.com/reel/ABC123/`).

### 2) Abre el archivo y pega un bloque nuevo
Abre `assets/data/instagram.json`. Cada reel es **una línea** con dos cosas:
el **enlace** y el **texto** que aparece sobre el video.

```json
{ "link": "PEGA_AQUI_EL_ENLACE", "caption": "Texto corto del video" },
```

Pega tu bloque **arriba del todo** (el primero de la lista es el que sale
primero en la web). Ejemplo de cómo queda la lista:

```json
[
  { "link": "https://www.instagram.com/reel/NUEVO/", "caption": "🚗 Nuevo ingreso esta semana" },
  { "link": "https://www.instagram.com/p/DZS1UZoyTSh/", "caption": "🔥 Toyota Crown Limited 2026" }
]
```

### 3) Guarda
Listo. La web se actualiza sola al guardar (si editas en GitHub, se publica
en 1–2 minutos).

---

## Reglas simples (para que no se rompa)
- Cada reel va entre llaves `{ }` y termina con **coma** `,` …
- … **menos el último**, que NO lleva coma.
- Toda la lista va dentro de los corchetes `[ ]`.
- Si un texto lleva comillas `"`, quítalas o cámbialas por comillas simples `'`.

> ¿Se rompió algo? Pega el contenido en **jsonlint.com** y te dice dónde está
> el error. O mándamelo y lo arreglo.

---

## Editarlo tú mismo en GitHub (sin programas)
1. Entra al repositorio en GitHub.
2. Abre `assets/data/instagram.json`.
3. Toca el **lápiz** (✏️ Edit).
4. Haz tus cambios → botón verde **Commit changes**.
5. En 1–2 minutos la web ya muestra lo nuevo.

---

## Quitar un reel
Borra su línea completa (desde `{` hasta `},`). Recuerda la regla de la coma
en el último.

---

## ¿Y si algún día quiero que se actualice solo?
Se puede, gratis y sin token de desarrollador, con un widget tipo
**Behold.so**, **SnapWidget** o **Elfsight**: conectas tu Instagram una vez
(solo iniciar sesión) y te dan un enlace. Ese enlace se pega en
`assets/js/config.js` → `endpoints.instagramFeed` y la web se actualiza sola.
Solo dime y te guío.
