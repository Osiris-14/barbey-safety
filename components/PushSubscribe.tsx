"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-auth";

/**
 * Botón que activa las notificaciones push del barbero.
 * Pide permiso, registra el service worker y guarda la suscripción en
 * push_subscriptions para que /api/push/notify pueda avisarle al agendar.
 */
export default function PushSubscribe() {
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);

    // Si ya está activada, no volver a preguntar cada vez que se entra
    navigator.serviceWorker?.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(Boolean(sub)))
      .catch(() => {});
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

      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const { endpoint, keys } = sub.toJSON();
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new Error("La suscripción no trae endpoint/keys");
      }

      const { error: insertError } = await supabaseAuth
        .from("push_subscriptions")
        .upsert(
          { endpoint, p256dh: keys.p256dh, auth: keys.auth },
          { onConflict: "endpoint" }
        );

      if (insertError) throw insertError;

      setEnabled(true);
    } catch (err) {
      console.error("[push] no se pudo activar la notificación:", err);
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Permiso denegado: activa las notificaciones desde los ajustes del navegador."
          : "No se pudieron activar las notificaciones. Revisa la consola."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-xs text-content/40">
        Tu navegador no soporta notificaciones.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={enable}
        disabled={busy || enabled}
        className={[
          "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition disabled:opacity-40",
          enabled
            ? "border-[#4CAF50]/40 bg-[#4CAF50]/10 text-[#4CAF50]"
            : "border-edge bg-surface-2 text-content/70 hover:border-primary/40 hover:text-primary",
        ].join(" ")}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : enabled ? (
          <BellRing className="h-3.5 w-3.5" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
        {busy
          ? "Activando…"
          : enabled
            ? "Notificaciones activadas"
            : "Activar notificaciones"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}