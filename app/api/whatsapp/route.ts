import { supabase } from "@/lib/supabase";
import { sendWhatsApp, wasSent } from "@/lib/whatsapp";

/** Ventana en la que un teléfono puede recibir mensajes tras agendar */
const WINDOW_MS = 2 * 60 * 1000;

export async function POST(req: Request) {
  let phone: string | undefined;
  let message: string | undefined;

  try {
    ({ phone, message } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!phone || !message) {
    return Response.json(
      { ok: false, error: "Faltan 'phone' o 'message'" },
      { status: 400 }
    );
  }

  // Sin una cita recién creada con ese teléfono no se envía nada: si no,
  // cualquiera podría usar la instancia de UltraMsg para mandar spam.
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data: recent, error: lookupError } = await supabase
    .from("appointments")
    .select("id")
    .eq("client_phone", phone)
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

  try {
    const result = await sendWhatsApp(phone, message);

    if (!wasSent(result)) {
      console.error("[whatsapp] UltraMsg rechazó el envío:", result);
      return Response.json({ ok: false, result }, { status: 502 });
    }

    return Response.json({ ok: true, result });
  } catch (err) {
    console.error("[whatsapp] error llamando a UltraMsg:", err);
    return Response.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
