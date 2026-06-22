# Panel de Administración — Promax Auto Broker

Sistema de inventario + leads (reutiliza el servidor Supabase de Family Key, con
**tablas propias de Promax**). El inventario que cargues en el panel aparece
**en vivo** en la web; si la base está vacía, la web usa el inventario de
respaldo (`/assets/data/inventory.json`), así nunca se rompe.

## 🔗 Links del panel

Mientras conectas el dominio, funcionan con la URL de Vercel:

| Panel | Link |
|---|---|
| Inventario | `…/admin/` |
| Leads | `…/admin/leads.html` |
| Instalar herramienta (bookmarklet) | `…/admin/install.html` |

Ejemplo: `https://pagina-web-promaxautobroker.vercel.app/admin/`
Con tu dominio quedará: `https://promaxautobroker.com/admin/`

**Contraseñas:**
- Login del panel: el email/clave que crees en el **Paso 3** (sugerido: `promax@promaxautobroker.com` / `ADMINPROMAX`).
- Herramienta bookmarklet (premium): **`PROMAX123456789`**

---

## ✅ Pasos para activarlo (una sola vez)

### Paso 1 — Crear las tablas en Supabase
Entra a tu Supabase (`db.ucallnow.fun`) → **SQL Editor** → pega y ejecuta esto:

```sql
-- ===== Inventario =====
create table if not exists public.promax_inventory (
  id text primary key,
  created_at timestamptz default now(),
  year int, make text, model text, trim text,
  body_type text, status text default 'available',
  price numeric, msrp numeric, mileage int,
  fuel text, transmission text, drivetrain text, engine text,
  exterior_color text, interior_color text,
  vin text, stock text, badge text,
  mpg_city int, mpg_highway int,
  featured boolean default false,
  features jsonb default '[]'::jsonb,
  description text,
  gallery jsonb default '[]'::jsonb,
  cover_image text,
  reserved_at timestamptz, reserved_by_name text, reserved_by_email text, reserved_by_phone text,
  sold_at timestamptz
);
alter table public.promax_inventory enable row level security;
create policy "promax_inv_public_read" on public.promax_inventory for select to anon using (true);
create policy "promax_inv_admin_all"  on public.promax_inventory for all to authenticated using (true) with check (true);

-- ===== Leads / Inquiries =====
create extension if not exists pgcrypto;
create table if not exists public.promax_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  form_type text,
  name text, email text, phone text,
  vehicle_title text, vehicle_id text,
  message text, source_url text,
  status text default 'new',
  raw jsonb
);
alter table public.promax_inquiries enable row level security;
create policy "promax_inq_public_insert" on public.promax_inquiries for insert to anon with check (true);
create policy "promax_inq_admin_read"    on public.promax_inquiries for select to authenticated using (true);
create policy "promax_inq_admin_update"  on public.promax_inquiries for update to authenticated using (true) with check (true);
create policy "promax_inq_admin_delete"  on public.promax_inquiries for delete to authenticated using (true);

-- Tiempo real en el panel de leads (opcional pero recomendado)
alter publication supabase_realtime add table public.promax_inquiries;
```

> Estas tablas son **independientes** de las de Family Key. No se tocan entre sí.

### Paso 2 — Crear el preset de Cloudinary (para subir fotos)
En Cloudinary (cuenta `drbc4wbvw`) → **Settings → Upload → Upload presets → Add upload preset**:
- **Name:** `promax_unsigned`
- **Signing Mode:** **Unsigned**
- (Opcional) **Folder:** `promax/inventory`
- Guardar.

### Paso 3 — Crear el usuario del login
En Supabase → **Authentication → Users → Add user**:
- **Email:** `promax@promaxautobroker.com` (o el que prefieras)
- **Password:** `ADMINPROMAX` (o la que quieras)
- Marca *Auto Confirm User* y guarda.

Con ese email + clave entras al panel de inventario y al de leads.

### Paso 4 — Probar
1. Abre `…/admin/` e inicia sesión.
2. Click **Agregar Vehículo**, llena los datos (o usa el bookmarklet) y guarda.
3. El carro aparece **al instante** en la web (`/inventory/` y destacados del home).
4. Manda un mensaje de prueba desde la web → aparece en `…/admin/leads.html`.

---

## 🌐 Paso 5 — Conectar tu dominio de Hostinger (para que aparezca tu dominio)

La web sigue en **Vercel** (gratis y rápido); Hostinger solo aporta el **dominio**.

**A) En Vercel** (panel del proyecto → *Settings → Domains → Add):**
- Agrega `promaxautobroker.com` y `www.promaxautobroker.com`.
- Vercel te mostrará los valores DNS que necesitas (te los confirma ahí mismo).

**B) En Hostinger** (panel del dominio → *DNS / Nameservers → Zona DNS*):
- Registro **A** para `@` →  `76.76.21.21`
- Registro **CNAME** para `www` → `cname.vercel-dns.com`
- *(Opcional, para `admin.tudominio.com`)* CNAME `admin` → `cname.vercel-dns.com`

> Usa exactamente los valores que te muestre Vercel (a veces cambian). La
> propagación tarda de minutos a unas horas.

**Después de conectar el dominio**, edita una línea en `/admin/index.html`:
```js
const SITE_URL='https://promaxautobroker.com';
```
(así el botón 👁 "Ver en la web" abre tu dominio).

---

## 🧰 Cómo cargar carros con el bookmarklet
1. Entra a `…/admin/install.html`, contraseña **`PROMAX123456789`**.
2. Arrastra el botón a tu barra de marcadores (instrucciones en la página).
3. En la página de un carro (Dealer.com / carsforsale), click al marcador → copia los datos.
4. Panel → **Agregar Vehículo** → **Pegar JSON** → revisar → guardar.

---

## ℹ️ Notas
- **Nada se rompe durante la migración:** si la tabla está vacía o falla, la web
  muestra el inventario de respaldo del archivo `inventory.json`.
- Los leads se guardan en Supabase **y** se siguen enviando a tu n8n (WhatsApp/email).
- Las claves `anon` de Supabase son públicas por diseño; la seguridad real está en
  las políticas RLS (solo un usuario con sesión puede crear/editar/borrar).
