-- ============================================================================
--  PROMAX AUTO BROKER — Espacio de fotos del panel admin (Supabase Storage)
--  ---------------------------------------------------------------------------
--  PARA QUÉ: el panel (promaxautobroker.com/admin) sube las fotos de los
--  vehículos aquí. Antes iban a Cloudinary; esa cuenta quedó suspendida y el
--  panel mostraba el error "cloud_name is disabled".
--
--  CÓMO: abrir Supabase → SQL Editor → pegar TODO esto → Run. Es una sola vez.
--  Al terminar, subir fotos desde el panel funciona de inmediato (no hay que
--  tocar nada más ni volver a desplegar la web).
--
--  QUÉ HACE: crea el espacio público "promax" (máx 50 MB por archivo, solo
--  imágenes) y los permisos: cualquiera puede VER las fotos (las muestra la
--  web) y solo un usuario con sesión iniciada en el panel puede subir,
--  reemplazar o borrar.
-- ============================================================================

-- 1) El espacio (bucket) donde viven las fotos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('promax', 'promax', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = 52428800,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

-- 2) Lectura pública: la web necesita mostrar las fotos a los visitantes
drop policy if exists "promax lectura publica" on storage.objects;
create policy "promax lectura publica" on storage.objects
  for select using (bucket_id = 'promax');

-- 3) Subir: solo con sesión iniciada (el panel admin)
drop policy if exists "promax insert auth" on storage.objects;
create policy "promax insert auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'promax');

-- 4) Reemplazar
drop policy if exists "promax update auth" on storage.objects;
create policy "promax update auth" on storage.objects
  for update to authenticated using (bucket_id = 'promax');

-- 5) Borrar
drop policy if exists "promax delete auth" on storage.objects;
create policy "promax delete auth" on storage.objects
  for delete to authenticated using (bucket_id = 'promax');

-- ---------------------------------------------------------------------------
-- COMPROBAR QUE QUEDÓ BIEN (debe devolver una fila con public = true):
--   select id, public, file_size_limit from storage.buckets where id = 'promax';
-- Las fotos quedarán en:
--   https://db.ucallnow.fun/storage/v1/object/public/promax/inventory/<archivo>
-- ---------------------------------------------------------------------------
