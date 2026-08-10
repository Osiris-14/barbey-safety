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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
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
