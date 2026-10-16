# Variables de entorno — Vercel (copiar y pegar)

Vercel → proyecto → **Settings → Environment Variables**.
Marca cada una para **Production, Preview y Development**.

## Proyecto principal (`barbey-safety`)

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `PEGAR_VALOR` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `PEGAR_VALOR` |
| `SUPABASE_SERVICE_ROLE_KEY` | `PEGAR_VALOR` |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | `PEGAR_VALOR` (vacío = `public`) |
| `ULTRAMSG_INSTANCE_ID` | `PEGAR_VALOR` |
| `ULTRAMSG_TOKEN` | `PEGAR_VALOR` |
| `CRON_SECRET` | `PEGAR_VALOR` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `PEGAR_VALOR` |
| `VAPID_PRIVATE_KEY` | `PEGAR_VALOR` |
| `VAPID_SUBJECT` | `PEGAR_VALOR` |
| `LEADS_NOTIFY_EMAIL` | `PEGAR_VALOR` |
| `RESEND_API_KEY` | `PEGAR_VALOR` |
| `LEADS_FROM_EMAIL` | `PEGAR_VALOR` |

## Landing (`ALytinc_Landing`, repo aparte)

Solo necesita estas 6 (las 3 primeras obligatorias):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `PEGAR_VALOR` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `PEGAR_VALOR` |
| `SUPABASE_SERVICE_ROLE_KEY` | `PEGAR_VALOR` |
| `RESEND_API_KEY` | `PEGAR_VALOR` |
| `LEADS_NOTIFY_EMAIL` | `PEGAR_VALOR` |
| `LEADS_FROM_EMAIL` | `PEGAR_VALOR` |

> Los valores salen de tu `.env.local` (nunca se sube al repo).
> La tabla `leads` debe existir en Supabase (`scripts/leads.sql`).
