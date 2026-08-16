-- Row Level Security — ejecutar completo en el SQL editor de Supabase.
--
-- IMPORTANTE: ejecuta las DOS partes. Con solo la parte 1 la app se rompe:
-- el rol `anon` pierde el UPDATE y dejan de funcionar los recordatorios
-- (se reenviarían cada minuto sin poder marcarse) y las banderas
-- confirmation_sent / reminder_sent que escribe la página del cliente.

-- ═══════════════════════════════════════════════════════════
-- PARTE 1 — activar RLS y políticas base
-- ═══════════════════════════════════════════════════════════

alter table appointments enable row level security;
alter table blocked_slots enable row level security;
alter table push_subscriptions enable row level security;

-- El barbero autenticado puede todo
create policy "auth solo" on appointments
  for all to authenticated using (true)
  with check (true);

create policy "auth solo" on blocked_slots
  for all to authenticated using (true)
  with check (true);

-- El cliente puede agendar sin estar autenticado
create policy "insert publico" on appointments
  for insert to anon with check (true);

-- El cliente necesita leer las citas para saber qué horas están ocupadas
create policy "leer publico" on appointments
  for select to anon using (true);

-- El cliente necesita leer los horarios bloqueados
create policy "leer publico" on blocked_slots
  for select to anon using (true);

-- El barbero registra sus suscripciones push desde el panel (authenticated).
-- anon solo las lee: /api/push/notify corre con la anon key en el servidor
-- y necesita ver a quién notificar cuando alguien agenda.
create policy "auth solo" on push_subscriptions
  for all to authenticated using (true)
  with check (true);

create policy "leer publico" on push_subscriptions
  for select to anon using (true);

-- ═══════════════════════════════════════════════════════════
-- PARTE 2 — sin esto la app queda rota
-- ═══════════════════════════════════════════════════════════
--
-- Quién escribe qué, y con qué rol:
--
--   app/page.tsx        confirmation_sent, reminder_sent   anon
--   /api/reminders      reminder_sent                      anon
--   panel /admin        status, blocked_slots              authenticated
--
-- El panel ya está cubierto por "auth solo". Lo que falta es permitir que
-- `anon` marque las dos banderas — y NADA más. El GRANT a nivel de columna
-- es lo que impide que alguien cambie status, nombre, teléfono o fecha:
-- la política habilita el UPDATE, el GRANT limita a qué columnas alcanza.

revoke update on appointments from anon;
grant update (confirmation_sent, reminder_sent) on appointments to anon;

create policy "banderas publicas" on appointments
  for update to anon using (true)
  with check (true);

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

-- anon lee push_subscriptions (lo necesita /api/push/notify)
grant select on push_subscriptions to anon;

-- ═══════════════════════════════════════════════════════════
-- Comprobación
-- ═══════════════════════════════════════════════════════════
--
-- Permisos por rol (authenticated debe tener UPDATE en appointments;
-- anon solo debe aparecer con UPDATE en confirmation_sent y reminder_sent):
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
