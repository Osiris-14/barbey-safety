"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Phone, RefreshCw, X } from "lucide-react";
import {
  supabase,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/supabase";
import { formatLongDate, formatTime, toDateKey } from "@/lib/schedule";

const POLL_MS = 30_000;

/** Color de la card según el estado de la cita */
const CARD_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-[#1C1C1C] border-[#2E2E2E]",
  confirmed: "bg-[#1A2E1A] border-[#4CAF50]",
  no_show: "bg-[#2E1A1A] border-[#EF5350]",
};

/** Badge de estado, arriba a la derecha de cada card */
const BADGE_STYLES: Record<AppointmentStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Pendiente",
      className: "border-edge text-content/50",
    },
    confirmed: {
      label: "Asistió",
      className: "border-[#4CAF50]/50 bg-[#4CAF50]/10 text-[#4CAF50]",
    },
    no_show: {
      label: "No asistió",
      className: "border-[#EF5350]/50 bg-[#EF5350]/10 text-[#EF5350]",
    },
  };

export default function AdminTodayPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", todayKey)
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("[citas] no se pudieron cargar las citas de hoy:", error);
      setError("No pudimos cargar las citas.");
    } else {
      setError(null);
      setAppointments((data ?? []) as Appointment[]);
    }
    setLoading(false);
  }, [todayKey]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS); // refresca para ver citas nuevas
    return () => clearInterval(id);
  }, [load]);

  /** Pinta la card al instante y revierte si Supabase rechaza el UPDATE */
  const setStatus = async (id: string, status: AppointmentStatus) => {
    const previous = appointments;

    setUpdating(id);
    setError(null);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );

    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[citas] no se pudo actualizar el estado:", error, {
        id,
        status,
      });
      setAppointments(previous);
      setError(`No pudimos actualizar el estado. ${error.message}`);
    }
    setUpdating(null);
  };

  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Citas de hoy</h1>
          <p className="mt-1 text-sm capitalize text-content/50">
            {formatLongDate(todayKey)}
          </p>
        </div>
        <button
          onClick={load}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-edge bg-surface px-3 text-xs text-content/60 transition hover:border-primary/40 hover:text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      {/* Siempre 3 columnas, en cualquier tamaño de pantalla */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <Metric label="Citas de hoy" value={total} />
        <Metric label="Asistieron" value={confirmed} accent="text-[#4CAF50]" />
        <Metric label="No asistieron" value={noShow} accent="text-[#EF5350]" />
      </div>

      {error && (
        <p className="mb-4 break-words rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-content/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge py-16 text-center text-sm text-content/40">
          No hay citas para hoy.
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {appointments.map((a) => {
            const badge = BADGE_STYLES[a.status] ?? BADGE_STYLES.pending;
            return (
              <li
                key={a.id}
                className={`flex min-h-[200px] flex-col rounded-2xl border p-4 transition-colors duration-300 ${
                  CARD_STYLES[a.status] ?? CARD_STYLES.pending
                }`}
              >
                {/* Hora a la izquierda, estado a la derecha */}
                <div className="flex items-start justify-between gap-2">
                  <span className="whitespace-nowrap rounded-lg bg-primary/15 px-2.5 py-1 text-sm font-semibold text-primary">
                    {formatTime(a.appointment_time)}
                  </span>
                  <span
                    className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Datos del cliente */}
                <div className="mt-4 min-w-0 flex-1">
                  <p className="truncate font-medium">{a.client_name}</p>
                  <a
                    href={`https://wa.me/${a.client_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1.5 text-xs text-content/50 transition hover:text-primary"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{a.client_phone}</span>
                  </a>
                </div>

                {/* Acciones o resultado */}
                {a.status === "pending" ? (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setStatus(a.id, "confirmed")}
                      disabled={updating === a.id}
                      className="flex h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-[#4CAF50]/50 bg-[#4CAF50]/10 px-2 text-xs font-medium text-[#4CAF50] transition hover:bg-[#4CAF50]/20 disabled:opacity-40"
                    >
                      <Check className="h-4 w-4 shrink-0" />
                      Asistió
                    </button>
                    <button
                      onClick={() => setStatus(a.id, "no_show")}
                      disabled={updating === a.id}
                      className="flex h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-[#EF5350]/50 bg-[#EF5350]/10 px-2 text-xs font-medium text-[#EF5350] transition hover:bg-[#EF5350]/20 disabled:opacity-40"
                    >
                      <X className="h-4 w-4 shrink-0" />
                      No
                    </button>
                  </div>
                ) : (
                  <p
                    className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${
                      a.status === "confirmed"
                        ? "text-[#4CAF50]"
                        : "text-[#EF5350]"
                    }`}
                  >
                    {a.status === "confirmed" ? (
                      <>
                        <Check className="h-4 w-4" />
                        Confirmado
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        No asistió
                      </>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  accent = "text-content",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-3 sm:p-4">
      <p className="text-[11px] text-content/50 sm:text-xs">{label}</p>
      <p className={`mt-1 text-xl font-semibold sm:text-2xl ${accent}`}>
        {value}
      </p>
    </div>
  );
}
