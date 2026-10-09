import { getSupabaseServer } from "@/lib/supabase-server";
import { TIME_SLOTS } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { phone?: unknown; date?: unknown; time?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";

  if (
    !/^\+1\d{10}$/.test(phone) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !TIME_SLOTS.includes(time as (typeof TIME_SLOTS)[number])
  ) {
    return Response.json({ ok: false, error: "Los datos de la cita no son válidos" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("appointments")
      .select("client_name, client_phone, appointment_date, appointment_time, status, cancellation_token")
      .eq("client_phone", phone)
      .eq("appointment_date", date)
      .eq("appointment_time", `${time}:00`)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return Response.json({ ok: false, error: "No encontramos una cita con esos datos" }, { status: 404 });
    }

    return Response.json({ ok: true, appointment: data });
  } catch (error) {
    console.error("[cita] no se pudo recuperar la cita:", error);
    return Response.json({ ok: false, error: "No pudimos recuperar la cita" }, { status: 500 });
  }
}
