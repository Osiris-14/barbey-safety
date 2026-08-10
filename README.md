# Yoan BarberShop

App de citas para barbería — Next.js 14 (App Router) + TypeScript + Tailwind + Supabase.

## Puesta en marcha

1. **Base de datos**: ejecuta `supabase/schema.sql` en el SQL editor de Supabase.
2. **Variables de entorno**: ya están en `.env.local`.
3. **Arrancar**:

```bash
npm install
npm run dev
```

| Ruta                    | Para qué sirve                       |
| ----------------------- | ------------------------------------ |
| `/`                     | El cliente agenda su cita (público)  |
| `/admin`                | Citas de hoy, con confirmación       |
| `/admin/appointments`   | Todas las citas, con filtros         |
| `/admin/blocked`        | Bloquear horarios                    |
| `/api/whatsapp`         | POST que envía un mensaje por UltraMsg |
| `/api/reminders`        | GET que avisa a las citas de dentro de 15 min |

## Estructura

```
lib/supabase.ts        cliente de Supabase + tipos
lib/schedule.ts        horarios, formato de fecha/hora, calendario
lib/whatsapp.ts        cliente de UltraMsg (solo servidor)
components/            componentes compartidos
app/page.tsx           stepper de 3 pasos del cliente
app/admin/             panel del barbero (layout con sidebar)
app/api/whatsapp/      envío puntual de un mensaje
app/api/reminders/     recordatorios automáticos, lo llama el cron
```

## Bot de WhatsApp

Variables de entorno (solo servidor, sin `NEXT_PUBLIC_`):

```
ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=
```

En producción hay que declararlas en Vercel → Settings → Environment
Variables: `.env.local` no se sube al repositorio.

### Recordatorios

`/api/reminders` busca citas con `reminder_sent = false`, `status = 'pending'`,
de hoy en hora dominicana (UTC-4), cuya hora caiga entre **+14 y +16 minutos**
respecto de ahora. Es decir, avisa 15 minutos antes, con 2 minutos de holgura
por si el cron se desfasa. `reminder_sent` se marca solo tras un envío
confirmado, así que una cita nunca recibe dos avisos y un fallo se reintenta.

El endpoint necesita que alguien lo llame **cada minuto**. El plan Hobby de
Vercel limita los cron jobs a una ejecución diaria, así que se usa un cron
externo:

1. Crear cuenta en [cron-job.org](https://cron-job.org)
2. **New cronjob** → URL: `https://yoan-barbershop.vercel.app/api/reminders`
3. **Schedule**: every 1 minute
4. Guardar

Responde `{ "sent": N }` con la cantidad de recordatorios enviados en esa
corrida; casi siempre será `0`, y eso es lo normal.

## Reglas de agenda

- Turnos de 45 minutos, de 9:30 AM a 5:45 PM (12 turnos, sin pausa).
- No hay días cerrados por regla fija: el barbero decide qué bloquear desde
  `/admin/blocked`. Solo se descartan las fechas pasadas.
- Un día se marca como no disponible cuando **todos** sus horarios están
  ocupados o bloqueados.
- Los horarios de `blocked_slots` no se muestran al cliente; los que ya tienen
  cita se muestran tachados y deshabilitados.

## Pendientes conocidos

- Sin autenticación en `/admin` (cualquiera con la URL entra).
- Sin RLS en Supabase: la anon key permite leer y escribir ambas tablas.
- `/api/whatsapp` y `/api/reminders` son públicos: cualquiera puede llamarlos.
- Para evitar dobles reservas por condición de carrera, descomenta el índice
  único al final de `supabase/schema.sql`.
