import { NextResponse } from "next/server";

type WhatsappPayload = {
  phone?: string;
  message?: string;
};

export async function POST(request: Request) {
  let body: WhatsappPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { phone, message } = body;

  if (!phone || !message) {
    return NextResponse.json(
      { ok: false, error: "Faltan 'phone' o 'message'" },
      { status: 400 }
    );
  }

  console.log("[whatsapp] →", phone, "|", message);

  // TODO: conectar UltraMsg
  // await fetch(`https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ token: ULTRAMSG_TOKEN, to: phone, body: message }),
  // });

  return NextResponse.json({ ok: true });
}
