import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de autenticación para el navegador.
 *
 * Se separa de `lib/supabase.ts` a propósito: este guarda la sesión en
 * cookies, que es la única forma de que `middleware.ts` pueda leerla en el
 * servidor. El otro cliente sigue usándose para las consultas de datos y
 * para las rutas de API, donde no hace falta sesión.
 */

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const supabaseAuth = createBrowserClient(supabaseUrl, supabaseAnonKey);
