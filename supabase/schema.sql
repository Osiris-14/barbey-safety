-- Ejecutar en el SQL editor de Supabase

create table appointments (
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

create table blocked_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time time not null
);

-- Suscripciones push del barbero. Las escribe el navegador del panel y
-- las lee /api/push/notify para avisarle cuando alguien agenda una cita.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index on appointments(appointment_date);

-- Evita dos citas activas en el mismo día y hora. Las canceladas no ocupan
-- el turno y por eso quedan fuera del índice.
create unique index appointments_unique_slot
  on appointments(appointment_date, appointment_time)
  where status <> 'cancelled';

create unique index blocked_slots_unique_slot
  on blocked_slots(slot_date, slot_time);

-- La página pública solo necesita saber qué turnos están ocupados; nunca
-- debe leer nombres, teléfonos ni tokens de cancelación.
create view public_appointment_slots as
  select appointment_date, appointment_time
    from appointments
   where status <> 'cancelled';
