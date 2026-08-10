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
| `/api/whatsapp`         | POST preparado, aún inactivo         |

## Estructura

```
lib/supabase.ts        cliente de Supabase + tipos
lib/schedule.ts        horarios, formato de fecha/hora, calendario
components/            componentes compartidos
app/page.tsx           stepper de 3 pasos del cliente
app/admin/             panel del barbero (layout con sidebar)
app/api/whatsapp/      handler preparado para UltraMsg
```

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
- Para evitar dobles reservas por condición de carrera, descomenta el índice
  único al final de `supabase/schema.sql`.
