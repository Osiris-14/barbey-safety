-- Row Level Security — ejecutar completo en el SQL editor de Supabase.
--
-- La app pública no recibe permisos directos sobre appointments: las reservas
-- y los cambios de banderas pasan por rutas de servidor con service role.

-- ═══════════════════════════════════════════════════════════
-- PARTE 1 — activar RLS y políticas base
-- ═══════════════════════════════════════════════════════════

alter table appointments enable row level security;
alter table blocked_slots enable row level security;
alter table push_subscriptions enable row level security;

-- El barbero autenticado puede todo
drop policy if exists "auth solo" on appointments;
create policy "auth solo" on appointments
  for all to authenticated using (true)
  with check (true);

drop policy if exists "auth solo" on blocked_slots;
create policy "auth solo" on blocked_slots
  for all to authenticated using (true)
  with check (true);

-- Las reservas pasan por /api/appointments, que valida el turno usando la
-- service role. Así anon no puede insertar fechas arbitrarias ni leer PII.
revoke select, insert, update on appointments from anon;
drop policy if exists "leer publico" on appointments;
drop policy if exists "insert publico" on appointments;

-- La página pública solo lee fecha/hora desde la vista reducida.
grant select on public_appointment_slots to anon;

-- El cliente necesita leer los horarios bloqueados
drop policy if exists "leer publico" on blocked_slots;
create policy "leer publico" on blocked_slots
  for select to anon using (true);

-- El barbero registra sus suscripciones push desde el panel (authenticated).
-- /api/push/notify usa la service role en el servidor.
drop policy if exists "auth solo" on push_subscriptions;
create policy "auth solo" on push_subscriptions
  for all to authenticated using (true)
  with check (true);

revoke select on push_subscriptions from anon;
drop policy if exists "leer publico" on push_subscriptions;

-- ═══════════════════════════════════════════════════════════
-- PARTE 2 — retirar permisos públicos heredados
-- ═══════════════════════════════════════════════════════════

revoke update on appointments from anon;
drop policy if exists "banderas publicas" on appointments;

-- ═══════════════════════════════════════════════════════════
-- PARTE 3 — permisos del barbero
-- ═══════════════════════════════════════════════════════════
--
-- Una política NO otorga permisos: Postgres exige las dos cosas, el GRANT
-- sobre la tabla y una política que deje pasar la fila. Supabase concede
-- los GRANT por defecto, pero si alguno se revocó, `authenticated` recibe
-- el mismo error 42501 "permission denied" que veía `anon`, y los botones
-- del panel dejan de guardar. Esto es idempotente: ejecútalo sin miedo.

grant select, insert, update, delete on appointments to authenticated;
grant select, insert, update, delete on blocked_slots to authenticated;
grant select, insert, update, delete on push_subscriptions to authenticated;

-- ═══════════════════════════════════════════════════════════
-- Comprobación
-- ═══════════════════════════════════════════════════════════
--
-- Permisos por rol (authenticated debe tener UPDATE en appointments;
-- anon debe tener SELECT solo sobre la vista y blocked_slots):
--
-- select grantee, privilege_type, table_name
--   from information_schema.role_table_grants
--  where table_name in ('appointments', 'blocked_slots')
--    and grantee in ('anon', 'authenticated')
--  order by grantee, table_name, privilege_type;
--
-- select grantee, privilege_type, table_name, column_name
--   from information_schema.column_privileges
--  where table_name = 'appointments' and grantee = 'anon';
--
-- select tablename, policyname, roles, cmd
--   from pg_policies
--  where tablename in ('appointments', 'blocked_slots')
--  order by tablename, policyname;
