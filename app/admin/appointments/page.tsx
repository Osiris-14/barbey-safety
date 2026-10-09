"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import { formatShortDate, formatTime, rdDateKey, rdNow } from "@/lib/schedule";

type StatusFilter = "all" | AppointmentStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Asistió" },
  { value: "no_show", label: "No asistió" },
  { value: "cancelled", label: "Cancelada" },
];

/** Estados editables, sin la opción "todos" del filtro */
const EDITABLE_STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Asistió" },
  { value: "no_show", label: "No asistió" },
  { value: "cancelled", label: "Cancelada" },
];

const SELECT_STYLES: Record<AppointmentStatus, string> = {
  pending: "border-edge bg-surface-2 text-content/70",
  confirmed: "border-[#4CAF50]/50 bg-[#4CAF50]/10 text-[#4CAF50]",
  no_show: "border-[#EF5350]/50 bg-[#EF5350]/10 text-[#EF5350]",
  cancelled: "border-content/20 bg-content/5 text-content/50",
};

export default function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const addDays = (dateKey: string, days: number) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + days))
      .toISOString()
      .slice(0, 10);
  };

  const setQuickRange = (days: number) => {
    const today = rdDateKey(rdNow());
    setDateFrom(today);
    setDateTo(addDays(today, days));
  };

  const load = useCallback(async () => {
    setLoading(true);

    let query = supabaseAuth
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (dateFrom) query = query.gte("appointment_date", dateFrom);
    if (dateTo) query = query.lte("appointment_date", dateTo);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data, error } = await query;

    if (error) {
      setError("No pudimos cargar las citas.");
    } else {
      setError(null);
      setAppointments((data ?? []) as Appointment[]);
    }
    setLoading(false);
  }, [dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Corrige el estado de una cita ya pasada. Mismo criterio que /admin:
   * se pinta al instante y se revierte si la base lo rechaza.
   */
  const setStatus = async (id: string, status: AppointmentStatus) => {
    const previous = appointments;

    setUpdating(id);
    setError(null);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );

    // .select() delata el rechazo silencioso: si una política de RLS filtra
    // la fila, el UPDATE afecta 0 filas y Postgres no devuelve error.
    const { data, error } = await supabaseAuth
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      console.error("[citas] no se pudo cambiar el estado:", error, {
        id,
        status,
      });
      setAppointments(previous);
      setError(
        `No pudimos cambiar el estado. ${error.message}${
          error.code ? ` (${error.code})` : ""
        }`
      );
    } else if (!data || data.length === 0) {
      console.error("[citas] el UPDATE no afectó ninguna fila:", { id, status });
      setAppointments(previous);
      setError(
        "El cambio no se guardó: la base rechazó la fila. Cierra sesión y vuelve a entrar."
      );
    }

    setUpdating(null);
  };

  const hasFilters = dateFrom !== "" || dateTo !== "" || statusFilter !== "all";

  const statusSelect = (a: Appointment) => (
    <select
      value={a.status}
      onChange={(e) => setStatus(a.id, e.target.value as AppointmentStatus)}
      disabled={updating === a.id}
      aria-label={`Estado de la cita de ${a.client_name}`}
      className={`min-h-[36px] cursor-pointer rounded-full border px-3 text-xs font-medium outline-none transition focus:border-primary disabled:opacity-50 ${
        SELECT_STYLES[a.status] ?? SELECT_STYLES.pending
      }`}
    >
      {EDITABLE_STATUSES.map((o) => (
        <option key={o.value} value={o.value} className="bg-surface text-content">
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold sm:text-2xl">Todas las citas</h1>
      <p className="mt-1 text-sm text-content/50">
        {loading ? "Cargando…" : `${appointments.length} cita(s)`}
      </p>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <label className="flex w-full flex-col gap-1 text-[11px] text-content/40 sm:w-auto">
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="min-h-[44px] rounded-xl border border-edge bg-surface px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>
        <label className="flex w-full flex-col gap-1 text-[11px] text-content/40 sm:w-auto">
          Hasta
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="min-h-[44px] rounded-xl border border-edge bg-surface px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="min-h-[44px] w-full rounded-xl border border-edge bg-surface px-4 text-sm outline-none transition focus:border-primary sm:w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {[7, 15, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setQuickRange(days)}
              className="min-h-[44px] flex-1 rounded-xl border border-edge px-3 text-xs text-content/60 transition hover:border-primary/40 hover:text-primary sm:flex-none"
            >
              Próximos {days} días
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setStatusFilter("all");
            }}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-edge px-3 text-xs text-content/50 transition hover:border-primary/40 hover:text-primary sm:w-auto"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Móvil: cards apiladas */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-content/40">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-edge py-14 text-center text-sm text-content/40">
            No hay citas que coincidan con el filtro.
          </div>
        ) : (
          appointments.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-edge bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.client_name}</p>
                  <p className="mt-0.5 text-xs text-content/50">
                    {a.client_phone}
                  </p>
                </div>
                {statusSelect(a)}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-edge/60 pt-3 text-sm">
                <span className="text-content/60">
                  {formatShortDate(a.appointment_date)}
                </span>
                <span className="text-content/25">·</span>
                <span className="font-medium text-primary">
                  {formatTime(a.appointment_time)}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Escritorio: tabla */}
      <div className="hidden overflow-x-auto rounded-2xl border border-edge bg-surface md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-edge text-xs uppercase tracking-wide text-content/40">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-content/40">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-content/40">
                  No hay citas que coincidan con el filtro.
                </td>
              </tr>
            ) : (
              appointments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-edge/60 last:border-0 transition hover:bg-surface-2"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatShortDate(a.appointment_date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-primary">
                    {formatTime(a.appointment_time)}
                  </td>
                  <td className="px-4 py-3">{a.client_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-content/60">
                    {a.client_phone}
                  </td>
                  <td className="px-4 py-3">
                    {statusSelect(a)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
