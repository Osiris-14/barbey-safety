# Yoan BarberShop

App de citas para barbería. El cliente agenda desde un enlace público sin
registrarse, puede cancelar su cita desde la pantalla de confirmación, y el
barbero gestiona el día desde un panel protegido. Las confirmaciones y los
recordatorios salen por WhatsApp automáticamente.

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
| Notificaciones push | Web Push (VAPID) |
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
| `/api/whatsapp` | Envía confirmación/recordatorio | exige token de cita reciente |
| `/api/reminders` | Recordatorios de dentro de 15 min | exige `CRON_SECRET` |
| `/api/push/notify` | Aviso push al barbero al agendar | exige token de cita reciente |
| `/api/appointments` | Valida y crea una cita | público, validado en servidor |
| `/api/cancel` | Cancela una cita y libera el turno | exige token privado |

## Estructura

```
lib/supabase.ts        cliente de datos + tipos
lib/supabase-server.ts  cliente service role, solo servidor
lib/supabase-auth.ts   cliente con sesión en cookies (panel y login)
lib/schedule.ts        turnos, hora dominicana, disponibilidad
lib/whatsapp.ts        cliente de UltraMsg (solo servidor)
lib/push.ts            envío de notificaciones push (VAPID, solo servidor)
middleware.ts          protege /admin con getUser()
app/page.tsx           stepper de 3 pasos del cliente
app/admin/             panel del barbero
app/api/               envío de WhatsApp, push y recordatorios
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

`/api/reminders` busca citas con `reminder_sent = false`, que no estén
canceladas ni marcadas como ausencia, y hora entre **+14 y +16 minutos**: avisa
15 minutos antes, con
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
- RLS activo: `anon` solo puede leer la vista pública de fechas/horas
  ocupadas. Crear y cancelar citas pasa por rutas de servidor; el resto exige
  sesión.
- Los nombres, teléfonos y tokens no se exponen en las consultas públicas.
- Un índice único parcial evita dobles reservas y una cita cancelada libera el
  turno inmediatamente.
- `/api/whatsapp` y `/api/push/notify` exigen el token privado de una cita
  recién creada.
- `/api/reminders` exige `Authorization: Bearer $CRON_SECRET`.
- La creación limita a cinco reservas activas por teléfono cada 24 horas.
  Para tráfico público conviene añadir rate limiting por IP en Vercel,
  Upstash o un WAF.

## Notificaciones push

Cuando el barbero pulsa "Activar notificaciones" en el panel, su navegador
guarda una suscripción en `push_subscriptions` (con RLS: solo él puede
escribirla). Al agendar una cita, la página llama a `/api/push/notify`,
que envía un push a todas las suscripciones. No depende de sesión del
cliente: es un servicio de sistema, funciona aunque el celular esté
bloqueado.

## Pendientes conocidos

- La anon key es la misma para todos los clientes alojados en un mismo
  proyecto de Supabase. Ver la nota final de `scripts/onboarding.md`.
- El panel no distingue barberos: quien tenga usuario ve todo el esquema.
- El envío de avisos depende de UltraMsg y del cron externo; si esos servicios
  fallan, la cita queda guardada y el panel sigue funcionando.
