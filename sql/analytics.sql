-- =====================================================================
-- PROMAX — MEDICIÓN DE TRÁFICO (analytics propio, primera parte)
-- Ejecutar UNA VEZ en Supabase Studio → SQL Editor → Run.
-- Guarda visitas, clics, WhatsApp, formularios, calor (x/y), scroll, etc.
-- Cualquier visitante puede INSERTAR (así se mide), pero solo el admin
-- autenticado puede LEER (tus datos no son públicos).
-- =====================================================================

create table if not exists public.promax_analytics (
  id         bigint generated always as identity primary key,
  ts         timestamptz not null default now(),
  visitor_id text not null,           -- anónimo, por navegador
  session_id text not null,           -- anónimo, por visita
  event      text not null,           -- pageview | heat | whatsapp | call | form | vehicle_view | lang | share | popup | scroll | click
  page       text,                    -- ruta de la página (/inventory/ …)
  ref        text,                    -- de dónde vino (referrer)
  utm        jsonb,                   -- utm_source/medium/campaign si vienen
  device     text,                    -- mobile | desktop
  lang       text,                    -- es | en
  meta       jsonb                    -- extra: {vehicle_id, x, y, el, depth, …}
);

alter table public.promax_analytics enable row level security;

-- El sitio (anónimo) solo puede ESCRIBIR eventos
drop policy if exists pmx_analytics_insert_anon on public.promax_analytics;
create policy pmx_analytics_insert_anon on public.promax_analytics
  for insert to anon with check (true);

-- Solo el admin logueado puede LEERLOS (dashboard)
drop policy if exists pmx_analytics_read_auth on public.promax_analytics;
create policy pmx_analytics_read_auth on public.promax_analytics
  for select to authenticated using (true);

-- Índices para que el dashboard vuele aunque haya millones de eventos
create index if not exists idx_pmx_an_ts        on public.promax_analytics (ts desc);
create index if not exists idx_pmx_an_event_ts  on public.promax_analytics (event, ts desc);
create index if not exists idx_pmx_an_page_ts   on public.promax_analytics (page, ts desc);
