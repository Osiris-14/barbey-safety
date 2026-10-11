export const dynamic = "force-dynamic";

type UltraStatus = {
  status?: string;
  substatus?: string;
};

/**
 * Estado real de la conexión con WhatsApp. Solo devuelve si está
 * configurado y conectado; nunca expone secretos ni el instance id.
 */
export async function GET() {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    return Response.json({ configured: false, connected: false });
  }

  try {
    const res = await fetch(
      `https://api.ultramsg.com/${instanceId}/instance/status?token=${encodeURIComponent(token)}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    const body = (await res.json().catch(() => null)) as UltraStatus | null;
    const connected =
      body?.status === "authenticated" && body?.substatus === "connected";
    return Response.json({ configured: true, connected });
  } catch (err) {
    console.error("[bot] no se pudo leer el estado de UltraMsg:", err);
    return Response.json({ configured: true, connected: false });
  }
}
