-- Ajustes del negocio (etapa catálogo).
-- Correr en el SQL Editor de Supabase, en el esquema que usa la app.
-- Reemplaza NOMBRE_ESQUEMA por el valor de NEXT_PUBLIC_SUPABASE_SCHEMA
-- (o `public` si la variable va vacía). Ctrl+H → Run.
--
-- app_settings guarda interruptores del negocio en una sola fila.
-- Hoy solo vive `catalog_enabled`: con el catálogo APAGADO (valor inicial),
-- la reserva pública funciona igual que siempre aunque haya servicios
-- creados. Al ENCENDERLO desde /admin/servicios, el cliente elige servicio.

create table if not exists NOMBRE_ESQUEMA.app_settings (
  id              integer primary key default 1 check (id = 1),
  catalog_enabled boolean not null default false,
  updated_at      timestamptz not null default now()
);

insert into NOMBRE_ESQUEMA.app_settings (id)
values (1)
on conflict (id) do nothing;

alter table NOMBRE_ESQUEMA.app_settings enable row level security;

drop policy if exists "auth solo" on NOMBRE_ESQUEMA.app_settings;
create policy "auth solo" on NOMBRE_ESQUEMA.app_settings
  for all to authenticated using (true)
  with check (true);

-- La página pública necesita leer el interruptor para saber si muestra
-- el paso de servicio. Es una sola fila sin datos sensibles.
drop policy if exists "publico lee" on NOMBRE_ESQUEMA.app_settings;
create policy "publico lee" on NOMBRE_ESQUEMA.app_settings
  for select to anon using (true);

revoke all on NOMBRE_ESQUEMA.app_settings from anon, authenticated;
grant select, insert, update, delete on NOMBRE_ESQUEMA.app_settings to authenticated;
grant select on NOMBRE_ESQUEMA.app_settings to anon;
grant all on NOMBRE_ESQUEMA.app_settings to service_role;

-- Comprobación
-- select * from NOMBRE_ESQUEMA.app_settings;
