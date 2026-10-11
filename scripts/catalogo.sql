-- Catálogo opcional de servicios (Etapa 2).
-- Correr en el SQL Editor de Supabase, en el esquema que usa la app.
-- Reemplaza NOMBRE_ESQUEMA por el valor de NEXT_PUBLIC_SUPABASE_SCHEMA
-- (o `public` si la variable va vacía). Ctrl+H → Run.
--
-- Es OPCIONAL: si la tabla queda vacía, la reserva pública funciona
-- exactamente igual que hoy. Cuando hay servicios activos, el cliente
-- elige uno como paso extra y la cita guarda su service_id.

create table if not exists NOMBRE_ESQUEMA.services (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 2 and 80),
  price         numeric(10, 2) check (price is null or price >= 0),
  duration_min  integer not null default 45 check (duration_min between 5 and 480),
  is_active     boolean not null default true,
  sort_order    integer not null default 0
);

-- La cita puede llevar servicio o no (catálogo vacío = sin cambios).
alter table NOMBRE_ESQUEMA.appointments
  add column if not exists service_id uuid
  references NOMBRE_ESQUEMA.services(id) on delete set null;

create index if not exists services_active_order_idx
  on NOMBRE_ESQUEMA.services (is_active, sort_order, name);

-- Mismo modelo que blocked_slots: el panel (authenticated) gestiona todo,
-- el cliente (anon) solo lee el catálogo activo. Nadie escribe desde el
-- navegador salvo el dueño autenticado; /api/appointments usa service role.
alter table NOMBRE_ESQUEMA.services enable row level security;

drop policy if exists "auth solo" on NOMBRE_ESQUEMA.services;
create policy "auth solo" on NOMBRE_ESQUEMA.services
  for all to authenticated using (true)
  with check (true);

drop policy if exists "leer publico" on NOMBRE_ESQUEMA.services;
create policy "leer publico" on NOMBRE_ESQUEMA.services
  for select to anon using (is_active = true);

grant select, insert, update, delete on NOMBRE_ESQUEMA.services to authenticated;
grant select on NOMBRE_ESQUEMA.services to anon;
grant all on NOMBRE_ESQUEMA.services to service_role;

-- Comprobación: catálogo visible para el cliente
-- select name, price, duration_min from NOMBRE_ESQUEMA.services
--  where is_active order by sort_order, name;
