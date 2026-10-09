import { getSupabaseServer } from "@/lib/supabase-server";
import { sendWhatsApp, wasSent } from "@/lib/whatsapp";

/** Ventana en la que un teléfono puede recibir mensajes tras agendar */
const WINDOW_MS = 2 * 60 * 1000;

export async function POST(req: Request) {
  let phone: unknown;
  let message: unknown;
  let cancellationToken: unknown;
  let type: unknown;

  try {
    ({ phone, message, cancellationToken, type } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (
    typeof phone !== "string" ||
    !/^\+1\d{10}$/.test(phone) ||
    typeof message !== "string" ||
    message.length === 0 ||
    message.length > 1000 ||
    typeof cancellationToken !== "string" ||
    !["confirmation", "reminder"].includes(type as string)
  ) {
    return Response.json(
      { ok: false, error: "Los datos del mensaje no son válidos" },
      { status: 400 }
    );
  }

  // Sin una cita recién creada con ese teléfono no se envía nada: si no,
  // cualquiera podría usar la instancia de UltraMsg para mandar spam.
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const supabase = getSupabaseServer();
  const { data: recent, error: lookupError } = await supabase
    .from("appointments")
    .select("id, reminder_sent")
    .eq("client_phone", phone)
    .eq("cancellation_token", cancellationToken)
    .neq("status", "cancelled")
    .gte("created_at", since)
    .limit(1);

  if (lookupError) {
    console.error("[whatsapp] no se pudo verificar la cita:", lookupError);
    return Response.json(
      { ok: false, error: "No se pudo verificar la cita" },
      { status: 500 }
    );
  }

  if (!recent || recent.length === 0) {
    console.warn(`[whatsapp] rechazado: sin cita reciente para ${phone}`);
    return Response.json(
      { ok: false, error: "No hay una cita reciente con ese teléfono" },
      { status: 403 }
    );
  }

  const appointmentId = recent[0].id as string;
  const claimBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  let reminderClaimed = false;

  if (type === "reminder") {
    if (recent[0].reminder_sent) {
      return Response.json({ ok: true, skipped: "already sent" });
    }

    const { data: claimed, error: claimError } = await supabase
      .from("appointments")
      .update({ reminder_claimed_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("reminder_sent", false)
      .or(`reminder_claimed_at.is.null,reminder_claimed_at.lt.${claimBefore}`)
      .select("id");

    if (claimError) throw claimError;
    if (!claimed || claimed.length === 0) {
      return Response.json({ ok: true, skipped: "already processing" });
    }
    reminderClaimed = true;
  }

  try {
    const result = await sendWhatsApp(phone, message);

    if (!wasSent(result)) {
      console.error("[whatsapp] UltraMsg rechazó el envío:", result);
      if (reminderClaimed) {
        await supabase
          .from("appointments")
          .update({ reminder_claimed_at: null })
          .eq("id", appointmentId);
      }
      return Response.json({ ok: false, result }, { status: 502 });
    }

    const flag =
      type === "confirmation"
        ? { confirmation_sent: true }
        : { reminder_sent: true, reminder_claimed_at: null };
    const { error: flagError } = await supabase
      .from("appointments")
      .update(flag)
      .eq("id", appointmentId);

    if (flagError) console.error("[whatsapp] no se pudo marcar el mensaje:", flagError);
    return Response.json({ ok: true, result });
  } catch (err) {
    console.error("[whatsapp] error llamando a UltraMsg:", err);
    if (reminderClaimed) {
      await supabase
        .from("appointments")
        .update({ reminder_claimed_at: null })
        .eq("id", appointmentId);
    }
    return Response.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
