import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function validToken(token: string | null): boolean {
  return Boolean(token && token.length >= 20 && token.length <= 100);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!validToken(token)) {
    return Response.json({ ok: false, error: "Token de cancelación inválido" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("appointments")
      .select("client_name, client_phone, appointment_date, appointment_time, status")
      .eq("cancellation_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return Response.json({ ok: false, error: "No encontramos esa cita" }, { status: 404 });
    }

    return Response.json({ ok: true, appointment: data });
  } catch (error) {
    console.error("[cancelación] no se pudo consultar la cita:", error);
    return Response.json({ ok: false, error: "No pudimos consultar la cita" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let token: unknown;

  try {
    ({ token } = await request.json());
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (typeof token !== "string" || !validToken(token)) {
    return Response.json({ ok: false, error: "Token de cancelación inválido" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data: appointment, error: lookupError } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("cancellation_token", token)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!appointment) {
      return Response.json({ ok: false, error: "No encontramos esa cita" }, { status: 404 });
    }
    if (appointment.status === "cancelled") {
      return Response.json({ ok: true, alreadyCancelled: true });
    }
    if (appointment.status === "no_show") {
      return Response.json({ ok: false, error: "Esta cita ya fue cerrada" }, { status: 409 });
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id)
      .in("status", ["pending", "confirmed"]);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[cancelación] no se pudo cancelar la cita:", error);
    return Response.json({ ok: false, error: "No pudimos cancelar la cita" }, { status: 500 });
  }
}
