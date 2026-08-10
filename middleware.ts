import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  ).trim();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Sin sesión: todo /admin manda al login (menos el login mismo)
  if (!session && pathname !== LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  // Con sesión: el login redirige al panel
  if (session && pathname === LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Solo el panel. La página pública y /api/reminders quedan fuera:
  // el cron externo llama a reminders sin sesión.
  matcher: ["/admin/:path*"],
};
