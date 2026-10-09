-- ═══════════════════════════════════════════════════════════
-- Alta de un barbero nuevo en el mismo proyecto de Supabase
-- ═══════════════════════════════════════════════════════════
--
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- ANTES: reemplaza NOMBRE_CLIENTE por el nombre real, en minúsculas y
-- sin espacios ni acentos (pedro, luis_hernandez). En el editor: Ctrl+H.
--
-- DESPUÉS quedan dos pasos que NO son SQL y sin los cuales la app no ve
-- nada de esto:
--
--   1. Settings → API → Exposed schemas: añadir NOMBRE_CLIENTE
--   2. En Vercel: NEXT_PUBLIC_SUPABASE_SCHEMA=NOMBRE_CLIENTE
--
-- Un esquema nuevo no hereda los permisos que Supabase concede sobre
-- `public`, por eso aquí hay GRANT explícitos que en el schema principal
-- no hacían falta.

-- ─── Esquema ───────────────────────────────────────────────

create schema NOMBRE_CLIENTE;

-- Sin USAGE, PostgREST no puede ni mirar dentro del esquema
grant usage on schema NOMBRE_CLIENTE to anon, authenticated;

-- ─── Tablas ────────────────────────────────────────────────

create table NOMBRE_CLIENTE.appointments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'no_show', 'cancelled')),
  confirmation_sent boolean default false,
  reminder_sent boolean default false,
  reminder_claimed_at timestamptz,
  created_at timestamptz default now(),
  cancellation_token text not null unique default gen_random_uuid()::text
);

create table NOMBRE_CLIENTE.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time time not null
);

-- Suscripciones push del barbero (notificaciones al agendar)
create table NOMBRE_CLIENTE.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index on NOMBRE_CLIENTE.appointments(appointment_date);

-- Evita dos citas en el mismo día y hora a nivel de base de datos.
-- La app ya comprueba antes de insertar, pero eso deja una ventana de
-- carrera que solo el índice cierra de verdad.
create unique index NOMBRE_CLIENTE_unique_slot
  on NOMBRE_CLIENTE.appointments(appointment_date, appointment_time)
  where status <> 'cancelled';

create unique index NOMBRE_CLIENTE_blocked_unique_slot
  on NOMBRE_CLIENTE.blocked_slots(slot_date, slot_time);

-- Vista mínima para que el cliente solo pueda consultar disponibilidad.
create view NOMBRE_CLIENTE.public_appointment_slots as
  select appointment_date, appointment_time
    from NOMBRE_CLIENTE.appointments
   where status <> 'cancelled';

-- ═══════════════════════════════════════════════════════════
-- RLS — las tres partes de supabase/rls.sql, ya adaptadas
-- ═══════════════════════════════════════════════════════════

-- ─── Parte 1: activar RLS y políticas base ─────────────────

alter table NOMBRE_CLIENTE.appointments enable row level security;
alter table NOMBRE_CLIENTE.blocked_slots enable row level security;
alter table NOMBRE_CLIENTE.push_subscriptions enable row level security;

-- El barbero autenticado puede todo
create policy "auth solo" on NOMBRE_CLIENTE.appointments
  for all to authenticated using (true)
  with check (true);

create policy "auth solo" on NOMBRE_CLIENTE.blocked_slots
  for all to authenticated using (true)
  with check (true);

-- Las reservas pasan por /api/appointments, con validación en servidor.

-- El cliente necesita leer los horarios bloqueados
create policy "leer publico" on NOMBRE_CLIENTE.blocked_slots
  for select to anon using (true);

-- El barbero registra sus suscripciones push desde el panel (authenticated).
-- /api/push/notify usa la service role en el servidor.
create policy "auth solo" on NOMBRE_CLIENTE.push_subscriptions
  for all to authenticated using (true)
  with check (true);

revoke select on NOMBRE_CLIENTE.push_subscriptions from anon;
drop policy if exists "leer publico" on NOMBRE_CLIENTE.push_subscriptions;

-- ─── Parte 2: permisos del cliente anónimo ─────────────────
--
-- El cliente solo recibe disponibilidad reducida. Las rutas de servidor usan
-- service role para crear/cancelar citas y actualizar banderas.

grant select on NOMBRE_CLIENTE.public_appointment_slots to anon;
grant select on NOMBRE_CLIENTE.blocked_slots to anon;
revoke select, insert, update on NOMBRE_CLIENTE.appointments from anon;
drop policy if exists "insert publico" on NOMBRE_CLIENTE.appointments;
drop policy if exists "leer publico" on NOMBRE_CLIENTE.appointments;
drop policy if exists "banderas publicas" on NOMBRE_CLIENTE.appointments;

-- ─── Parte 3: permisos del barbero ─────────────────────────

grant select, insert, update, delete
  on NOMBRE_CLIENTE.appointments to authenticated;
grant select, insert, update, delete
  on NOMBRE_CLIENTE.blocked_slots to authenticated;
grant select, insert, update, delete
  on NOMBRE_CLIENTE.push_subscriptions to authenticated;

-- ═══════════════════════════════════════════════════════════
-- Comprobación
-- ═══════════════════════════════════════════════════════════
--
-- Las tablas existen y tienen RLS activo:
--
-- select tablename, rowsecurity
--   from pg_tables where schemaname = 'NOMBRE_CLIENTE';
--
-- Las 6 políticas están creadas:
--
-- select tablename, policyname, roles, cmd
--   from pg_policies where schemaname = 'NOMBRE_CLIENTE'
--  order by tablename, policyname;
--
-- anon no tiene acceso directo a appointments:
--
-- select privilege_type, column_name
--   from information_schema.column_privileges
--  where table_schema = 'NOMBRE_CLIENTE'
--    and table_name = 'appointments'
--    and grantee = 'anon' and privilege_type = 'UPDATE';
