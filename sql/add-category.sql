-- =====================================================================
-- PROMAX — Catálogo multi-categoría
-- Ejecutar UNA VEZ en el SQL Editor de Supabase (db.ucallnow.fun).
-- Agrega la columna `category` al inventario. Los registros existentes
-- quedan como 'cars' (correcto: todos eran carros).
--
-- Categorías válidas (slugs):
--   cars | trucks_machinery | vans | motorcycles | utv | watercraft
-- =====================================================================

alter table promax_inventory
  add column if not exists category text not null default 'cars';

-- Índice para filtrar rápido por categoría
create index if not exists idx_promax_inventory_category
  on promax_inventory (category);
