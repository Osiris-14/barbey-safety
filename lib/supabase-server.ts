import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SCHEMA } from "@/lib/supabase";

/** Cliente privilegiado: solo debe importarse desde rutas del servidor. */
export function getSupabaseServer() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno"
    );
  }

  return createClient(url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, ""), key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SUPABASE_SCHEMA },
  });
}
