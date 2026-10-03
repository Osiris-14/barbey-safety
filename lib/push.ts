/**
 * Cliente de notificaciones push (web push / VAPID).
 * Se usa desde el servidor: las claves privadas no deben llegar al navegador.
 * La pública (NEXT_PUBLIC_) sí, porque el navegador la necesita al suscribirse.
 */

import webpush from "web-push";

/** La fila tal como se guarda en la tabla push_subscriptions */
export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** ¿Están todas las claves VAPID en el entorno? Si no, no hay push */
export function vapidConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

/**
 * Envía una notificación a todas las suscripciones del barbero.
 * Devuelve cuántas llegaron a la cola del navegador y cuántas fallaron.
 */
export async function sendPush(
  subscriptions: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number; failed: number }> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.error(
      "[push] faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT"
    );
    return { sent: 0, failed: subscriptions.length };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, url: payload.url ?? "/admin" }),
        // Apple retrasa o agrupa los "normal" (modo ahorro, pantalla bloqueada);
        // una cita nueva es aviso inmediato. TTL: si el teléfono está apagado,
        // vale la pena entregarlo hasta 1 día después, no 4 semanas.
        { urgency: "high", TTL: 24 * 60 * 60 }
      );
      sent++;
    } catch (err) {
      // 404/410 = el suscriptor se dio de baja; el resto son errores reales
      console.error("[push] falló el envío a un suscriptor:", err);
      failed++;
    }
  }

  return { sent, failed };
}