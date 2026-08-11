import { createClient } from "@supabase/supabase-js";

/**
 * supabase-js espera la URL base del proyecto (https://xxx.supabase.co),
 * no el endpoint REST. Normalizamos por si en .env.local viene con
 * "/rest/v1/" o con espacios al inicio/final.
 */
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
  );
}

/**
 * Esquema de Postgres del que lee la app. Por defecto `public`.
 *
 * Sirve para alojar varios barberos en el mismo proyecto de Supabase, cada
 * uno en su esquema (ver scripts/nuevo-cliente.sql). Dos requisitos:
 * el esquema debe estar en Settings → API → Exposed schemas, y necesita
 * GRANT USAGE para anon y authenticated — en un esquema nuevo no hay
 * permisos por defecto, a diferencia de `public`.
 */
export const SUPABASE_SCHEMA =
  (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "").trim() || "public";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  db: { schema: SUPABASE_SCHEMA },
});

export type AppointmentStatus = "pending" | "confirmed" | "no_show";

export type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM:SS
  status: AppointmentStatus;
  confirmation_sent: boolean;
  reminder_sent: boolean;
  created_at: string;
};

export type BlockedSlot = {
  id: string;
  slot_date: string; // YYYY-MM-DD
  slot_time: string; // HH:MM:SS
};
