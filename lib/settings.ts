import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ¿El negocio activó el catálogo? Lo enciende el dueño desde
 * /admin/servicios. Si la tabla no existe aún (falta scripts/ajustes.sql),
 * responde false: la reserva funciona igual que siempre.
 * Sirve para el cliente anon y para la service role (ambos son SupabaseClient).
 */
export async function isCatalogEnabled(
  // any: los clientes usan esquema dinámico (SUPABASE_SCHEMA) o fijo
  db: SupabaseClient<any, any>
): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("app_settings")
      .select("catalog_enabled")
      .eq("id", 1)
      .limit(1)
      .maybeSingle();
    if (error || !data) return false;
    return (data as { catalog_enabled?: boolean }).catalog_enabled === true;
  } catch {
    return false;
  }
}
