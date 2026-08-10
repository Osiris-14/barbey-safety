/**
 * Cliente de UltraMsg. Solo debe usarse desde el servidor:
 * ULTRAMSG_TOKEN no lleva prefijo NEXT_PUBLIC_ y no puede llegar al navegador.
 */

/** Respuesta típica de UltraMsg: {"sent":"true","message":"ok","id":123} */
export type UltraMsgResponse = {
  sent?: string | boolean;
  message?: string;
  id?: number | string;
  error?: string | Record<string, unknown>;
};

export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<UltraMsgResponse> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    throw new Error(
      "Faltan ULTRAMSG_INSTANCE_ID o ULTRAMSG_TOKEN en las variables de entorno"
    );
  }

  const res = await fetch(
    `https://api.ultramsg.com/${instanceId}/messages/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, to: phone, body: message }),
      cache: "no-store",
    }
  );

  // UltraMsg responde 200 incluso en algunos errores; devolvemos el cuerpo tal cual.
  const text = await res.text();
  try {
    return JSON.parse(text) as UltraMsgResponse;
  } catch {
    return { error: `Respuesta no-JSON (HTTP ${res.status}): ${text}` };
  }
}

/** UltraMsg devuelve sent como la cadena "true" cuando el envío entró en cola */
export function wasSent(result: UltraMsgResponse): boolean {
  if (result.error) return false;
  return result.sent === true || result.sent === "true";
}
