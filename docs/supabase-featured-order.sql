-- =====================================================================
-- PROMAX — Orden manual de los "Vehículos Destacados" de la portada
-- ---------------------------------------------------------------------
-- Qué hace: agrega una columna `featured_order` (número) a la tabla del
-- inventario. Sirve para decidir, DESDE EL PANEL, en qué ORDEN salen los
-- carros marcados como "Destacado" en la página principal.
--   • menor número = aparece primero (1 sale antes que 2, 2 antes que 3…)
--   • vacío = sale después de los numerados (ordenados por año, más nuevo primero)
--
-- Cómo correrlo: Supabase → SQL Editor → pega TODO esto → Run. Una sola vez.
-- Es seguro correrlo varias veces (usa IF NOT EXISTS; no borra ni cambia datos).
--
-- Mientras NO se corra: el sitio y el panel funcionan igual; los destacados
-- salen primero por año. Al correrlo, se activa el orden manual que elijas.
-- =====================================================================

alter table public.promax_inventory
  add column if not exists featured_order integer;

-- Índice para ordenar rápido solo los destacados (opcional pero recomendado).
create index if not exists promax_inventory_featured_order_idx
  on public.promax_inventory (featured_order)
  where featured is true;
