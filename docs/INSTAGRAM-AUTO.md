# Instagram automático en la web (sección Nosotros)

La sección **Nosotros** muestra una galería con tus reels de Instagram. Al
tocar una tarjeta, abre el video directo en Instagram.

Ahora mismo funciona con una lista fija (`assets/data/instagram.json`) que ya
trae tus reels reales. Para que se **actualice solo** cada vez que publicas,
tienes 2 caminos. **El paso final en los dos es el mismo:** pegar una URL en
`assets/js/config.js` → `endpoints.instagramFeed`.

---

## Opción A — n8n (todo en tu infraestructura) ✅ recomendada

Ya tienes el archivo: `automation/promax-instagram.n8n.json`.

1. **n8n → Import** ese archivo (igual que el de los leads de WhatsApp).
2. Abre el nodo **🔑 Ajustes (EDITA AQUÍ)** y pega tu **token de Instagram**.
3. **Activa** el workflow (toggle arriba a la derecha).
4. Copia la **Production URL** del nodo *Webhook* y pégala en
   `assets/js/config.js` → `endpoints.instagramFeed`.

El workflow ya trae un sub-flujo que **renueva el token solo cada 50 días**,
así no se vence nunca.

### ¿De dónde sale el token? (una sola vez, ~15 min)
1. Tu Instagram debe ser cuenta **Profesional** (Negocio o Creador).
   Ajustes → *Cambiar a cuenta profesional* (gratis).
2. Entra a **developers.facebook.com** → *Mis Apps* → **Crear app** →
   tipo **"Otro" / Business**.
3. Agrega el producto **Instagram** → *API con inicio de sesión de Instagram*.
4. En *Generar token de acceso*, conecta tu cuenta y copia el **token de larga
   duración**. Ese es el que pegas en el paso 2 de arriba.

> Si en algún momento se complica, escríbeme el token y yo dejo todo conectado.

---

## Opción B — Widget gratis (lo más rápido, ~5 min)

Si no quieres tocar developers.facebook.com:

1. Entra a **behold.so** (gratis) y conecta tu Instagram.
2. Te da una **URL de feed** (JSON).
3. Pégala en `assets/js/config.js` → `endpoints.instagramFeed`.

Listo, se actualiza solo. (Igual de válido: SnapWidget, LightWidget.)

---

## Mientras tanto / opción manual

Si `endpoints.instagramFeed` está **vacío**, la web usa
`assets/data/instagram.json`. Para agregar un reel a mano, copia un bloque y
cambia el `permalink` (la URL del reel) y el `caption`:

```json
{
  "permalink": "https://www.instagram.com/p/CODIGO_DEL_REEL/",
  "thumbnail": "",
  "type": "VIDEO",
  "caption": "Texto corto que aparece sobre el video"
}
```

> Nota honesta: Instagram no deja que una web tome tus videos sin permiso, por
> eso cualquier opción automática (A o B) necesita conectar tu cuenta **una
> vez**. No hay forma de saltarse ese paso único; es regla de Meta.
