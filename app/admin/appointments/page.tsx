"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/supabase";
// Con sesión: bajo RLS el panel actúa como `authenticated`, no como `anon`
import { supabaseAuth as supabase } from "@/lib/supabase-auth";
import { formatShortDate, formatTime } from "@/lib/schedule";
import { StatusBadge } from "@/components/StatusBadge";

type StatusFilter = "all" | AppointmentStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Asistió" },
  { value: "no_show", label: "No asistió" },
];

export default function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (dateFilter) query = query.eq("appointment_date", dateFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data, error } = await query;

    if (error) {
      setError("No pudimos cargar las citas.");
    } else {
      setError(null);
      setAppointments((data ?? []) as Appointment[]);
    }
    setLoading(false);
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const hasFilters = dateFilter !== "" || statusFilter !== "all";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold sm:text-2xl">Todas las citas</h1>
      <p className="mt-1 text-sm text-content/50">
        {loading ? "Cargando…" : `${appointments.length} cita(s)`}
      </p>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-edge bg-surface px-4 text-sm outline-none transition focus:border-primary sm:w-auto"
        />
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
        {hasFilters && (
          <button
            onClick={() => {
              setDateFilter("");
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
                <StatusBadge status={a.status} />
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
                    <StatusBadge status={a.status} />
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
