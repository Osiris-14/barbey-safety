-- Ejecutar en el SQL editor de Supabase

create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  status text default 'pending'
    check (status in ('pending', 'confirmed', 'no_show')),
  confirmation_sent boolean default false,
  reminder_sent boolean default false,
  created_at timestamptz default now()
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

-- Recomendado: evita dos citas en el mismo día y hora a nivel de base de datos.
-- create unique index appointments_unique_slot
--   on appointments(appointment_date, appointment_time);
