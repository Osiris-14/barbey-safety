-- Solicitudes de acceso de la landing de Alytinc (/alytinc → #empezar).
-- Correr en el SQL Editor de Supabase, en el esquema que usa la app.
-- Reemplaza NOMBRE_ESQUEMA por el valor de NEXT_PUBLIC_SUPABASE_SCHEMA
-- (o `public` si la variable va vacía). Ctrl+H → Run.

create table if not exists NOMBRE_ESQUEMA.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 3 and 100),
  business_name text check (char_length(business_name) <= 100),
  business_type text not null check (business_type in ('barberia','salon','unas','otro')),
  phone         text not null check (phone ~ '^\+1\d{10}$'),
  city          text check (char_length(city) <= 80),
  consent       boolean not null check (consent),
  source        text not null default 'landing',
  status        text not null default 'new' check (status in ('new','contacted','won','lost'))
);

-- Para el límite por teléfono en las últimas 24 h
create index if not exists leads_phone_created_idx
  on NOMBRE_ESQUEMA.leads (phone, created_at desc);

-- RLS activo y SIN políticas para anon/authenticated: nadie lee ni escribe
-- desde el navegador. Solo /api/leads, con la service role, inserta.
alter table NOMBRE_ESQUEMA.leads enable row level security;
revoke all on NOMBRE_ESQUEMA.leads from anon, authenticated;
grant select, insert, update on NOMBRE_ESQUEMA.leads to service_role;

-- Ver las solicitudes nuevas desde el Table Editor, o con:
-- select created_at, name, business_name, business_type, phone, city, status
--   from NOMBRE_ESQUEMA.leads order by created_at desc;
