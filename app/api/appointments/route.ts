import { getSupabaseServer } from "@/lib/supabase-server";
import {
  rdClock,
  TIME_SLOTS,
  type RdClock,
} from "@/lib/schedule";

export const dynamic = "force-dynamic";

const PHONE_RE = /^\+1\d{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isPastSlot(date: string, time: string, now: RdClock): boolean {
  return date < now.date || (date === now.date && time <= now.time);
}

export async function POST(request: Request) {
  let body: { name?: unknown; phone?: unknown; date?: unknown; time?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";

  if (name.length < 3 || name.length > 100) {
    return Response.json({ ok: false, error: "El nombre no es válido" }, { status: 400 });
  }
  if (!PHONE_RE.test(phone)) {
    return Response.json({ ok: false, error: "El teléfono no es válido" }, { status: 400 });
  }
  if (!isValidDateKey(date) || !TIME_SLOTS.includes(time as (typeof TIME_SLOTS)[number])) {
    return Response.json({ ok: false, error: "La fecha o el horario no son válidos" }, { status: 400 });
  }

  const now = rdClock();
  if (isPastSlot(date, time, now)) {
    return Response.json({ ok: false, error: "Ese horario ya pasó" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Protección básica contra reservas masivas con el mismo número.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("client_phone", phone)
      .neq("status", "cancelled")
      .gte("created_at", since);

    if (countError) throw countError;
    if ((count ?? 0) >= 5) {
      return Response.json(
        { ok: false, error: "Ese número ya tiene demasiadas reservas recientes" },
        { status: 429 }
      );
    }

    const [{ data: blocked, error: blockedError }, { data: booked, error: bookedError }] =
      await Promise.all([
        supabase
          .from("blocked_slots")
          .select("id")
          .eq("slot_date", date)
          .eq("slot_time", `${time}:00`)
          .limit(1),
        supabase
          .from("appointments")
          .select("id")
          .eq("appointment_date", date)
          .eq("appointment_time", `${time}:00`)
          .neq("status", "cancelled")
          .limit(1),
      ]);

    if (blockedError) throw blockedError;
    if (bookedError) throw bookedError;
    if (blocked && blocked.length > 0) {
      return Response.json({ ok: false, error: "Ese horario está bloqueado" }, { status: 409 });
    }
    if (booked && booked.length > 0) {
      return Response.json({ ok: false, error: "Ese horario acaba de ser ocupado" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        client_name: name,
        client_phone: phone,
        appointment_date: date,
        appointment_time: `${time}:00`,
        status: "pending",
        cancellation_token: crypto.randomUUID(),
      })
      .select("id, cancellation_token")
      .single();

    if (error) {
      // El índice único cierra la carrera entre dos clientes que reservaron a la vez.
      if (error.code === "23505") {
        return Response.json({ ok: false, error: "Ese horario acaba de ser ocupado" }, { status: 409 });
      }
      throw error;
    }

    return Response.json({ ok: true, appointment: data });
  } catch (error) {
    console.error("[cita] no se pudo crear la cita:", error);
    return Response.json({ ok: false, error: "No pudimos guardar tu cita" }, { status: 500 });
  }
}
