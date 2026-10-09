-- Migración para la instalación actual del cliente en el esquema public.
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Este archivo está listo para copiar y ejecutar tal cual.

alter table public.appointments
  add column if not exists cancellation_token text;

alter table public.appointments
  add column if not exists reminder_claimed_at timestamptz;

update public.appointments
   set cancellation_token = gen_random_uuid()::text
 where cancellation_token is null;

alter table public.appointments
  alter column cancellation_token set default gen_random_uuid()::text,
  alter column cancellation_token set not null;

update public.appointments
   set status = 'pending'
 where status is null;

alter table public.appointments
  alter column status set not null;

create unique index if not exists appointments_cancellation_token_unique
  on public.appointments(cancellation_token);

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'no_show', 'cancelled'));

create unique index if not exists appointments_unique_slot
  on public.appointments(appointment_date, appointment_time)
  where status <> 'cancelled';

-- Los bloqueos duplicados son equivalentes: conserva uno por turno para que
-- el índice único pueda crearse.
delete from public.blocked_slots older
using public.blocked_slots newer
where older.slot_date = newer.slot_date
  and older.slot_time = newer.slot_time
  and older.id > newer.id;

create unique index if not exists blocked_slots_unique_slot
  on public.blocked_slots(slot_date, slot_time);

drop view if exists public.public_appointment_slots;

create view public.public_appointment_slots as
  select appointment_date, appointment_time
    from public.appointments
   where status <> 'cancelled';

revoke select, insert, update on public.appointments from anon;
drop policy if exists "leer publico" on public.appointments;
drop policy if exists "insert publico" on public.appointments;
drop policy if exists "banderas publicas" on public.appointments;

grant select on public.public_appointment_slots to anon;

revoke select on public.push_subscriptions from anon;
drop policy if exists "leer publico" on public.push_subscriptions;
