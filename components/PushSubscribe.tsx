"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase-auth";

/**
 * Botón que activa las notificaciones push del barbero.
 * Pide permiso, registra el service worker y guarda la suscripción en
 * push_subscriptions para que /api/push/notify pueda avisarle al agendar.
 *
 * En iPhone (Safari y Chrome usan WebKit) el push solo funciona si la web
 * está instalada como PWA, es decir, agregada a la pantalla de inicio y
 * abierta desde su ícono. Si no está en modo standalone se le indica cómo
 * instalarla antes de pedir el permiso.
 */
/** Guarda (o refresca) la suscripción en push_subscriptions */
async function saveSubscription(sub: PushSubscription) {
  const { endpoint, keys } = sub.toJSON();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("La suscripción no trae endpoint/keys");
  }

  const { error } = await supabaseAuth
    .from("push_subscriptions")
    .upsert(
      { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: "endpoint" }
    );

  if (error) throw error;
}

export default function PushSubscribe() {
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se calculan en el navegador (useEffect) y no al renderizar: en el
  // servidor no hay navigator y el HTML no coincidiría con el del cliente.
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error propiedad legacy de iOS
        Boolean(window.navigator.standalone)
    );

    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;

    // Si ya está activada, no volver a preguntar cada vez que se entra.
    // Además se vuelve a guardar en la base: iOS cambia el endpoint cuando
    // se reinstala la app o se renuevan los permisos, y si la fila queda
    // vieja el servidor envía a un endpoint muerto y nunca llega nada.
    navigator.serviceWorker
      .getRegistration("/")
      .then((reg) => reg?.pushManager.getSubscription())
      .then(async (sub) => {
        if (!sub || Notification.permission !== "granted") return;
        await saveSubscription(sub);
        setEnabled(true);
      })
      .catch((err) => console.error("[push] no se pudo sincronizar:", err));
  }, []);

  /** La VAPID public key viene en base64url y PushManager la quiere como Uint8Array */
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      // iOS solo muestra el diálogo de permiso si se pide en el mismo toque,
      // antes de cualquier await que pueda "gastar" el gesto del usuario
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        const denied = new Error("Permiso de notificaciones no concedido");
        denied.name = "NotAllowedError";
        throw denied;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await saveSubscription(sub);

      setEnabled(true);
    } catch (err) {
      console.error("[push] no se pudo activar la notificación:", err);
      const detail =
        err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Permiso denegado: activa las notificaciones desde los ajustes del navegador."
          : `No se pudieron activar las notificaciones. ${detail}`
      );
    } finally {
      setBusy(false);
    }
  };

  // iPhone: antes de activar hay que instalar la app a la pantalla de inicio.
  // Va antes del chequeo de soporte: en una pestaña de Safari iOS no expone
  // PushManager, y sin este orden nunca se verían los pasos de instalación.
  if (isIos && !isStandalone) {
    return (
      <div className="push-help">
        <p>Para recibir notificaciones en tu iPhone:</p>
        <ol>
          <li>
            Toca <b>Compartir</b> ⬆ en Safari.
          </li>
          <li>Pulsa “Agregar a pantalla de inicio”.</li>
          <li>Abre la app desde su ícono y vuelve a pulsar este botón.</li>
        </ol>
      </div>
    );
  }

  if (!supported) {
    return (
      <p className="push-error" style={{ color: "var(--muted)" }}>
        Tu navegador no soporta notificaciones.
      </p>
    );
  }

  // Estilos en app/admin/admin.css (.notification): solo se usa en el panel
  if (enabled) {
    return (
      <div className="notification">
        <span className="status-dot" />
        <div>
          <strong>Notificaciones activas</strong>
          <small>Te avisamos cuando alguien agenda</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={enable}
        disabled={busy}
        className="notification notification-button off"
      >
        <span className="status-dot" />
        <div>
          <strong>{busy ? "Activando…" : "Activar notificaciones"}</strong>
          <small>Recibe un aviso con cada cita nueva</small>
        </div>
      </button>
      {error && <p className="push-error">{error}</p>}
    </>
  );
}
