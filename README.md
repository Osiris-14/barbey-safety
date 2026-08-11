# Yoan BarberShop

App de citas para barbería. El cliente agenda desde un enlace público sin
registrarse, y el barbero gestiona el día desde un panel protegido. Las
confirmaciones y los recordatorios salen por WhatsApp automáticamente.

> **¿Instalando esto para un cliente nuevo?**
> → [`scripts/onboarding.md`](scripts/onboarding.md) — 10-15 minutos.

## Stack

| | |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS, sin librerías de UI |
| Iconos | lucide-react |
| Base de datos | Supabase (Postgres + RLS) |
| Autenticación | Supabase Auth, sesión en cookies vía `@supabase/ssr` |
| WhatsApp | UltraMsg |
| Cron | cron-job.org, cada minuto |
| Hosting | Vercel |

## Puesta en marcha

```bash
cp .env.example .env.local   # y rellena los valores
npm install
npm run dev
```

La base de datos se crea con [`supabase/schema.sql`](supabase/schema.sql) y
[`supabase/rls.sql`](supabase/rls.sql) en el SQL Editor de Supabase.
Para un cliente nuevo en un esquema aparte, usa
[`scripts/nuevo-cliente.sql`](scripts/nuevo-cliente.sql).

## Rutas

| Ruta | Para qué sirve | Acceso |
| --- | --- | --- |
| `/` | El cliente agenda su cita | público |
| `/admin` | Citas de hoy, confirmar o marcar ausencia | con sesión |
| `/admin/appointments` | Todas las citas, con filtros | con sesión |
| `/admin/blocked` | Bloquear horarios | con sesión |
| `/admin/login` | Entrada del barbero | público |
| `/api/whatsapp` | Envía un mensaje | exige cita reciente |
| `/api/reminders` | Recordatorios de dentro de 15 min | exige `CRON_SECRET` |

## Estructura

```
lib/supabase.ts        cliente de datos + tipos
lib/supabase-auth.ts   cliente con sesión en cookies (panel y login)
lib/schedule.ts        turnos, hora dominicana, disponibilidad
lib/whatsapp.ts        cliente de UltraMsg (solo servidor)
middleware.ts          protege /admin con getUser()
app/page.tsx           stepper de 3 pasos del cliente
app/admin/             panel del barbero
app/api/               envío de WhatsApp y recordatorios
scripts/               alta de clientes nuevos
supabase/              esquema y políticas de RLS
```

## Reglas de agenda

- Turnos de 45 minutos, de 9:30 AM a 11:45 PM (20 turnos, sin pausa).
- Todo se decide en **hora dominicana (UTC-4)**, no en la del dispositivo:
  un cliente en otro huso vería días y horas corridos.
- No hay días cerrados por regla fija — el barbero bloquea desde
  `/admin/blocked`. Se descartan las fechas pasadas y los días sin ningún
  turno **futuro** libre.
- Un turno se muestra tachado si ya tiene cita o si su hora pasó.

## Recordatorios

`/api/reminders` busca citas con `reminder_sent = false`, `status =
'pending'` y hora entre **+14 y +16 minutos**: avisa 15 minutos antes, con
2 de holgura por si el cron se desfasa. `reminder_sent` se marca solo tras
un envío confirmado, así que nadie recibe dos avisos y un fallo se
reintenta al minuto siguiente.

Las citas cuya ventana ya pasó se marcan sin enviar nada, para que el cron
no las evalúe indefinidamente. Y si alguien agenda con menos de 15 minutos
de antelación, el recordatorio sale en el momento desde la propia página,
porque el cron ya no llega a tiempo.

## Seguridad

- `/admin` protegido por middleware con `getUser()`, que valida el token
  contra Supabase — `getSession()` solo decodifica la cookie y una
  fabricada pasaría.
- RLS activo: `anon` puede leer y agendar, y solo puede actualizar
  `confirmation_sent` y `reminder_sent`. El resto exige sesión.
- `/api/whatsapp` exige una cita con ese teléfono creada hace menos de 2
  minutos; si no, 403. Sin eso sería un relay de spam a costa de tu
  cuenta de UltraMsg.
- `/api/reminders` exige `Authorization: Bearer $CRON_SECRET`.

## Pendientes conocidos

- La anon key es la misma para todos los clientes alojados en un mismo
  proyecto de Supabase. Ver la nota final de `scripts/onboarding.md`.
- El panel no distingue barberos: quien tenga usuario ve todo el esquema.
