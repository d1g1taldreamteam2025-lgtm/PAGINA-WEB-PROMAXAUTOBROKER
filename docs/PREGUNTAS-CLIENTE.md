# ✅ Lo único que necesitamos de Promax para dejar la web 100% lista

Hola 👋 La página web ya está construida y funcionando con datos de muestra.
Para terminarla y publicarla, solo necesitamos que nos confirmes los siguientes
datos **de una vez** (responde en la misma lista, lo que no tengas ahora lo
dejamos como está y se ajusta luego).

---

## 1) Marca 🎨
- **Logo**: envíanos el logo en PNG o SVG (fondo transparente si es posible).
- **Color principal de la marca** (el que más los identifica): _______
  - *Por ahora usamos rojo `#E11D2A`. ¿Lo dejamos, o prefieren otro? (ej. azul, negro/dorado, etc.)*

## 2) Datos de contacto ☎️
- **Teléfono**: _______
- **WhatsApp** (si es distinto al teléfono): _______
- **Email** público: _______
- **Dirección** completa (calle, ciudad, estado, ZIP): _______
- **Horarios** de atención (por día): _______

## 3) Redes sociales 🔗
Confirmar que estas son correctas (ya las pusimos):
- Instagram: https://www.instagram.com/promaxautobroker/
- Facebook: https://www.facebook.com/104409542167703
- YouTube: https://www.youtube.com/@Promaxautobroker/community
- TikTok: https://www.tiktok.com/@promaxautobroker
- ¿Falta alguna otra? _______

## 4) ¿Qué quieren destacar? 💬
- ¿Aceptan **ITIN**? ¿Trabajan con **crédito en construcción / primer comprador**? (Sí / No): _______
- **Pago inicial** mínimo aproximado: _______
- ¿Ofrecen **garantía**? ¿De qué tipo?: _______
- 3 frases / beneficios que más quieren resaltar: _______

## 5) Inventario 🚙
- ¿Tienen los vehículos en algún **sistema/Excel/CRM**, o los cargamos a mano?: _______
- ¿Quién va a **mantener el inventario** actualizado?: _______
- ¿Nos pueden pasar **fotos + datos** de los autos reales (marca, modelo, año, millaje, precio)?: _______

## 6) ¿A dónde quieren que lleguen los mensajes de la web? 📥
(Formularios de financiamiento, contacto y newsletter)
- ¿A un **email**? ¿A un **WhatsApp**? ¿A un **CRM / Google Sheet**?: _______

## 7) Referidos y Sorteo 🎁 (la sección interna)
- **Meta para el sorteo**: ¿100 ventas está bien, u otro número?: _______
- ¿Qué cuenta como "venta" para el sorteo?: _______
- ¿El sorteo es entre **quien refiere** o entre **el cliente referido**?: _______
- **Premio** del sorteo: _______
- **Clave** para entrar a la página interna de referidos (la define el equipo): _______
- ¿A qué **cuenta de Google (Gmail)** debe pertenecer la Hoja de cálculo? (la persona que la administrará): _______
- ¿Quiénes del equipo van a **registrar** los referidos?: _______

## 8) Dominio / publicación 🌐
- ¿Ya tienen un **dominio**? (ej. promaxautobroker.com) ¿Cuál?: _______
- Si no, ¿quieren que les ayudemos a sacarlo?: _______

## 9) Textos legales / "Nosotros" 📄
- **Nombre legal** del negocio (para Términos y Privacidad): _______
- **Ciudad/Estado** para las políticas: _______
- ¿Tienen una **foto del local o del equipo** para la sección "Nosotros"?: _______
- ¿Desde qué **año** operan? (para "X años de experiencia"): _______

---

### 📝 Notas internas (para el desarrollador — no enviar al cliente)
Mientras llega la respuesta, la web ya funciona con valores provisionales marcados
con `// <-- CONFIRMAR` en `assets/js/config.js`. Al recibir las respuestas:
1. Actualizar `assets/js/config.js` (contacto, redes, webhook, referidos).
2. Reemplazar `assets/img/logo.svg`, `logo-white.svg`, `favicon.svg`.
3. Ajustar `--brand` en `assets/css/theme.css` si cambian el color.
4. Cargar inventario real en `assets/data/inventory.json` (o conectar API).
5. Desplegar el Google Apps Script (`google-apps-script/Code.gs`) y pegar la URL + token.
6. Configurar dominio y GitHub Pages (Settings → Pages → GitHub Actions).
