"use client";

import { useEffect } from "react";

/**
 * Red de seguridad: si algo falla en el navegador del cliente, en vez de la
 * pantalla negra "Application error" se muestra un mensaje y un botón para
 * reintentar. Al reintentar se limpia la cita guardada en el navegador, que
 * es lo único que la página lee al arrancar.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] error no controlado:", error);
  }, [error]);

  const retry = () => {
    try {
      window.localStorage.removeItem("barbey-safety:cancellation-token");
    } catch {
      // Almacenamiento bloqueado: no hay nada que limpiar
    }
    reset();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-night px-4">
      <div className="w-full max-w-[380px] rounded-2xl border border-edge bg-surface p-6 text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-content/60">
          No pudimos cargar la página. Inténtalo de nuevo; si sigue pasando,
          ábrela en Safari o Chrome.
        </p>
        <button
          onClick={retry}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-night"
        >
          Reintentar
        </button>
        <a
          href="/"
          className="mt-3 block w-full rounded-xl border border-edge px-4 py-3 text-sm text-content/70"
        >
          Volver al inicio
        </a>
      </div>
    </main>
  );
}
