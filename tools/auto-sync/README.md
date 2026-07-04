# 🤖 Robot de inventario (sincronización automática semanal)

Trae el inventario de varios concesionarios y lo mete/actualiza en Supabase
**solo, cada lunes a las ~6:00 a.m.** (sin que nadie haga clic en nada). Corre
en **GitHub Actions** con un Chromium real (pasa los antibots), recorre TODAS
las páginas de cada dealer, entra a cada ficha por sus **5 fotos**, filtra por
año (2020+, camiones 2022+), asigna la categoría, y:

- **Sube** todo (upsert por VIN → nunca duplica).
- **Marca como vendidos** los que ya no aparecen en el dealer (desaparecen del
  catálogo público).

## ✅ Puesta en marcha (una sola vez)

### 1) Columnas en Supabase (SQL Editor)
```sql
alter table public.promax_inventory add column if not exists category text default 'cars';
alter table public.promax_inventory add column if not exists source text;
alter table public.promax_inventory add column if not exists source_url text;
alter table public.promax_inventory add column if not exists last_sync timestamptz;
create index if not exists idx_pmx_inv_source_status on promax_inventory (source, status, last_sync);
```

### 2) Secrets en GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|---|---|
| `SUPABASE_URL` | `https://db.ucallnow.fun` |
| `SUPABASE_SERVICE_KEY` | la **service_role** key de Supabase (Settings → API → `service_role`). Tiene permiso de escritura; por eso va como secret, nunca en el código. |

### 3) Activar Actions
Pestaña **Actions** del repo → habilitar workflows si están apagados.

## ▶ Cómo se usa
- **Automático:** corre solo los lunes 10:00 UTC (≈ 6 a.m. Miami en verano).
  Para cambiar la hora, edita el `cron` en
  `.github/workflows/inventory-sync.yml` (está en UTC).
- **A mano:** pestaña **Actions → "Sincronizar inventario (semanal)" → Run
  workflow**. Al terminar, en el log ves cuántos trajo de cada dealer.

## 🛠 Qué dealers trae
Se configuran en `dealers.json` (nombre, URL de la lista, `source`, `minYear`,
y `isTrucks`/`isPower` para camiones/powersports). Agregar o quitar dealers es
editar ese archivo.

## ⚠️ Notas honestas
- **Antibot:** AutoDeal e International (DealerCenter/Carsforsale) suelen dejar
  pasar. **hgreg** (Cloudflare) y **motoport** (Imperva) pueden bloquear al
  robot; si un dealer sale con 0, el log lo dice y no rompe a los demás. Para
  esos, la vía 100% estable es pedirle al dealer su **feed oficial**.
- **Fotos:** las URLs apuntan al servidor del dealer. Se puede activar
  Cloudinary "fetch" para cachearlas/optimizarlas (mejora futura).
- **Prueba local:** `PROMAX_CHROMIUM` y `PROMAX_DEALERS_FILE` permiten correrlo
  contra fixtures sin tocar producción (ver `scratchpad/test-cron.js`).
