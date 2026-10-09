# Onboarding de un barbero nuevo

De cero a agendando: **10–15 minutos**. Los pasos van en orden; el 6
depende del 3 y el 5 depende del 4.

En los ejemplos el cliente se llama **pedro**.

---

## Paso 1 — Repo (2 min)

1. Abre [github.com/Osiris-14/barbey-safety](https://github.com/Osiris-14/barbey-safety)
2. **Use this template** → **Create a new repository**
3. Nombre: `pedro-barbershop`
4. Visibilidad: **Private**

---

## Paso 2 — Nombre en la app (2 min)

En el repo nuevo, busca `Yoan BarberShop` y reemplázalo por el nombre del
cliente. Aparece en cuatro archivos:

| Archivo | Dónde se ve |
| --- | --- |
| `app/layout.tsx` | pestaña del navegador |
| `app/page.tsx` | cabecera, pantalla de éxito, mensajes de WhatsApp |
| `app/admin/layout.tsx` | sidebar y menú móvil |
| `app/api/reminders/route.ts` | mensaje del recordatorio |

Reemplaza también el logo y el fondo: `public/logo.jpeg` y
`public/fondo.jpg`, con los mismos nombres de archivo.

Commit y push.

---

## Paso 3 — Vercel (3 min)

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importa `pedro-barbershop`
3. **Environment Variables** — las variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_SCHEMA=pedro
SUPABASE_SERVICE_ROLE_KEY=
ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:pedro@barbershop.do
```

La `SUPABASE_SERVICE_ROLE_KEY` es privada: nunca debe llevar el prefijo
`NEXT_PUBLIC_` ni aparecer en el navegador. Las de UltraMsg salen del paso 5;
puedes dejarlas vacías y volver.

Genera las claves VAPID de las notificaciones push:

```bash
npx web-push generate-vapid-keys --json
```

Copia `publicKey` a `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `privateKey` a
`VAPID_PRIVATE_KEY`. Sin ellas, la app agenda igual pero no llega el aviso
al barbero.

Genera un `CRON_SECRET` distinto por cliente:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

4. **Deploy**

> `NEXT_PUBLIC_SUPABASE_SCHEMA` es lo que separa a un cliente de otro
> dentro del mismo Supabase. Si lo omites, la app escribe en `public` y
> **dos barberos comparten agenda**.

---

## Paso 4 — Supabase (2 min)

1. **SQL Editor** → pega `scripts/nuevo-cliente.sql`
2. Reemplaza `NOMBRE_CLIENTE` por `pedro` (Ctrl+H) → **Run**
3. **Settings → API → Exposed schemas**: añade `pedro` y guarda
4. **Authentication → Users → Add user**: correo y contraseña del barbero,
   marcando **Auto Confirm User**

Si el cliente ya tenía una instalación anterior, ejecuta también
[`scripts/upgrade-cliente.sql`](upgrade-cliente.sql), reemplazando
`NOMBRE_CLIENTE` por su esquema. Esa migración añade la cancelación, la
protección contra reservas duplicadas y la vista pública mínima.

> El paso 3 no es opcional. Sin exponer el esquema, PostgREST devuelve 404
> en cada consulta aunque las tablas existan. Y sin *Auto Confirm* el
> usuario queda pendiente de verificar por correo y no puede entrar.

---

## Paso 5 — UltraMsg (3 min)

1. [ultramsg.com](https://ultramsg.com) → **Add Instance**
2. Escanea el QR con el **WhatsApp Business del barbero**
3. Copia *Instance ID* y *Token* a las variables de Vercel del paso 3
4. Comprueba que la instancia quedó conectada:

```bash
curl "https://api.ultramsg.com/INSTANCE_ID/instance/status?token=TOKEN"
```

Debe responder `"status":"authenticated","substatus":"connected"`.

> Una instancia por cliente. Si dos comparten instancia, los mensajes
> salen del WhatsApp equivocado.

---

## Paso 6 — Cron de recordatorios (2 min)

1. [cron-job.org](https://cron-job.org) → **Create cronjob**
2. URL: `https://pedro-barbershop.vercel.app/api/reminders`
3. Schedule: **Every 1 minute**
4. **Advanced → Headers**:

```
Authorization: Bearer EL_CRON_SECRET_DEL_PASO_3
```

5. Activa la notificación por fallo, para enterarte si deja de responder

> El header no es opcional: sin él el endpoint responde 401 y no sale
> ningún recordatorio. Y el `CRON_SECRET` debe ser el mismo que pusiste en
> Vercel.
>
> No se usa el cron de Vercel porque el plan Hobby limita los cron jobs a
> una ejecución diaria.

---

## Comprobación final

Antes de entregarle la app al cliente:

- [ ] `https://pedro-barbershop.vercel.app` carga y muestra el calendario
- [ ] `/api/reminders` sin header responde **401**
- [ ] `/api/reminders` con el header responde **200** y `{"sent":0}`
- [ ] `/admin` redirige a `/admin/login`
- [ ] El barbero entra con su usuario y ve el panel
- [ ] Los botones ✓ y ✗ guardan el estado (recarga y compruébalo)
- [ ] En el panel, el barbero activa las notificaciones push; luego agenda
      una cita de prueba y le llega el aviso en la barra de notificaciones
- [ ] Agenda una cita de prueba con tu número: llega la confirmación
- [ ] En la pantalla de éxito pulsa “Cancelar cita” y comprueba que el turno
      vuelve a estar disponible
- [ ] Agenda otra a 20 minutos: el recordatorio llega ~15 min antes
- [ ] Borra las citas de prueba desde el panel

Si los botones ✓/✗ fallan con `permission denied`, falta el `grant` de la
parte 3 del SQL. Si el panel carga pero no guarda nada, revisa que el
navegador tenga sesión — el aviso ámbar de `/admin` lo indica.

---

## Qué se comparte y qué no

| | Compartido | Por cliente |
| --- | --- | --- |
| Proyecto de Supabase | ✅ | |
| Esquema de Postgres | | ✅ `pedro` |
| Usuario del panel | | ✅ |
| Instancia de UltraMsg | | ✅ |
| Proyecto de Vercel | | ✅ |
| `CRON_SECRET` | | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | | compartida, privada |

Un solo proyecto de Supabase aguanta muchos barberos, pero **la anon key
es la misma para todos**. Con RLS activo eso limita el daño a lo que
permiten las políticas: leer citas y agendar. Aun así, un cliente
técnicamente curioso podría leer la agenda de otro si adivina el nombre
del esquema y lo consulta directo. Si eso importa, dale a cada cliente su
propio proyecto de Supabase y cambia solo la URL y la key.
