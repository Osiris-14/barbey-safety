import { sendWhatsApp, wasSent } from "@/lib/whatsapp";

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
