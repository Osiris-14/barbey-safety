-- Bot de WhatsApp, etapa 1: interruptores reales + historial real.
-- Correr en el SQL Editor de Supabase, en el esquema que usa la app.
-- Reemplaza NOMBRE_ESQUEMA por el valor de NEXT_PUBLIC_SUPABASE_SCHEMA
-- (o `public` si la variable va vacía). Ctrl+H → Run.
--
-- Qué hace:
--   · bot_settings: una sola fila con los interruptores que ve el panel en
--     /admin/bot. Apagar "confirmaciones" o "recordatorios" detiene esos
--     envíos de verdad (lo leen /api/whatsapp y /api/reminders).
--   · wa_messages: bitácora de cada intento de envío (enviado, fallido u
--     omitido). De aquí salen los números y el historial del panel.
-- Sin este script todo sigue funcionando igual (los envíos van activados
-- por defecto y el panel muestra que falta activar el bot).

-- ─── Interruptores ──────────────────────────────────────────

create table if not exists NOMBRE_ESQUEMA.bot_settings (
  id                     integer primary key default 1 check (id = 1),
  confirmations_enabled  boolean not null default true,
  reminders_enabled      boolean not null default true,
  updated_at             timestamptz not null default now()
);

insert into NOMBRE_ESQUEMA.bot_settings (id)
values (1)
on conflict (id) do nothing;

alter table NOMBRE_ESQUEMA.bot_settings enable row level security;

drop policy if exists "auth solo" on NOMBRE_ESQUEMA.bot_settings;
create policy "auth solo" on NOMBRE_ESQUEMA.bot_settings
  for all to authenticated using (true)
  with check (true);

revoke all on NOMBRE_ESQUEMA.bot_settings from anon;
grant select, insert, update, delete on NOMBRE_ESQUEMA.bot_settings to authenticated;
grant all on NOMBRE_ESQUEMA.bot_settings to service_role;

-- ─── Bitácora de envíos ─────────────────────────────────────

create table if not exists NOMBRE_ESQUEMA.wa_messages (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  phone          text not null,
  kind           text not null check (kind in ('confirmation', 'reminder')),
  status         text not null check (status in ('sent', 'failed', 'skipped')),
  detail         text,
  appointment_id uuid references NOMBRE_ESQUEMA.appointments(id) on delete set null
);

create index if not exists wa_messages_created_idx
  on NOMBRE_ESQUEMA.wa_messages (created_at desc);

alter table NOMBRE_ESQUEMA.wa_messages enable row level security;

-- El panel solo LEE el historial. Escribe únicamente la service role
-- desde /api/whatsapp y /api/reminders.
drop policy if exists "panel lee" on NOMBRE_ESQUEMA.wa_messages;
create policy "panel lee" on NOMBRE_ESQUEMA.wa_messages
  for select to authenticated using (true);

revoke all on NOMBRE_ESQUEMA.wa_messages from anon, authenticated;
grant select on NOMBRE_ESQUEMA.wa_messages to authenticated;
grant all on NOMBRE_ESQUEMA.wa_messages to service_role;

-- Comprobación
-- select * from NOMBRE_ESQUEMA.bot_settings;
-- select kind, status, count(*) from NOMBRE_ESQUEMA.wa_messages
--  group by kind, status order by kind, status;
