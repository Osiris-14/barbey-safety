import { supabase } from "@/lib/supabase";
import { sendPush, vapidConfigured } from "@/lib/push";

/** Ventana en la que un teléfono puede generar avisos tras agendar */
const WINDOW_MS = 2 * 60 * 1000;

export const dynamic = "force-dynamic";

/**
 * Notifica al barbero (push) cuando alguien agenda una cita.
 * Misma protección que /api/whatsapp: sin una cita recién creada con ese
 * teléfono no se envía nada, para que nadie use el endpoint de spam.
 */
export async function POST(req: Request) {
  let phone: string | undefined;
  let message: { title: string; body: string } | undefined;

  try {
    ({ phone, message } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!phone) {
    return Response.json(
      { ok: false, error: "Falta 'phone'" },
      { status: 400 }
    );
  }

  if (!vapidConfigured()) {
    console.warn(
      "[push] falta configuración VAPID: no se enviará notificación al agendar"
    );
    return Response.json({ ok: true, skipped: "sin VAPID" });
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data: recent, error: lookupError } = await supabase
    .from("appointments")
    .select("id")
    .eq("client_phone", phone)
    .gte("created_at", since)
    .limit(1);

  if (lookupError) {
    console.error("[push] no se pudo verificar la cita:", lookupError);
    return Response.json(
      { ok: false, error: "No se pudo verificar la cita" },
      { status: 500 }
    );
  }

  if (!recent || recent.length === 0) {
    console.warn(`[push] rechazado: sin cita reciente para ${phone}`);
    return Response.json(
      { ok: false, error: "No hay una cita reciente con ese teléfono" },
      { status: 403 }
    );
  }

  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (subsError) {
    console.error("[push] no se pudieron leer las suscripciones:", subsError);
    return Response.json(
      { ok: false, error: "No se pudieron leer las suscripciones" },
      { status: 500 }
    );
  }

  if (!subs || subs.length === 0) {
    console.warn("[push] no hay suscripciones: el barbero no ha activado notificaciones");
    return Response.json({ ok: true, sent: 0, failed: 0 });
  }

  const result = await sendPush(
    subs as { endpoint: string; p256dh: string; auth: string }[],
    message ?? { title: "Nueva cita agendada", body: "Revisa el panel." }
  );

  return Response.json({ ok: true, ...result });
}