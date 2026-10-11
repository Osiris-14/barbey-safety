"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import { formatTime } from "@/lib/schedule";
import {
  PageHeader,
  STATUSES,
  STATUS_LABEL,
  StatusPill,
  initials,
  rdTodayKey,
  updateAppointmentStatus,
  waLink,
} from "../_components/admin-ui";

type StatusFilter = "all" | AppointmentStatus;
type QuickRange = 7 | 15 | 30;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] })),
];

function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-10-09" → "9 oct" */
function shortDay(key: string): string {
  return keyToDate(key).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
  });
}

/** Etiqueta de la cajita dorada: Hoy / Mañana / Ayer / día de la semana */
function dayTag(key: string, todayKey: string): string {
  const diff = Math.round(
    (keyToDate(key).getTime() - keyToDate(todayKey).getTime()) / 86_400_000
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  return keyToDate(key)
    .toLocaleDateString("es-DO", { weekday: "short" })
    .replace(".", "");
}

export default function AllAppointmentsPage() {
  const todayKey = useMemo(() => rdTodayKey(), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [range, setRange] = useState({ start: "", end: "" });
  const [quickRange, setQuickRange] = useState<QuickRange | null>(null);

  // El rango de fechas filtra en la base; nombre y estado, en el navegador
  const load = useCallback(async () => {
    setLoading(true);

    let request = supabaseAuth
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (range.start) request = request.gte("appointment_date", range.start);
    if (range.end) request = request.lte("appointment_date", range.end);

    const { data, error } = await request;

    if (error) {
      console.error("[citas] no se pudieron cargar las citas:", error);
      setError("No pudimos cargar las citas.");
    } else {
      setError(null);
      setAppointments((data ?? []) as Appointment[]);
    }
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Corrige el estado de una cita. Mismo criterio que /admin: se pinta al
   * instante y se revierte si la base lo rechaza.
   */
  const setStatus = async (id: string, status: AppointmentStatus) => {
    const previous = appointments;

    setUpdating(id);
    setError(null);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );

    const message = await updateAppointmentStatus(id, status);
    if (message) {
      setAppointments(previous);
      setError(message);
    }

    setUpdating(null);
  };

  /** Próximos N días a partir de hoy (hora RD) */
  const selectQuickRange = (days: QuickRange) => {
    const [y, m, d] = todayKey.split("-").map(Number);
    const end = new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
    setRange({ start: todayKey, end });
    setQuickRange(days);
  };

  const rangeActive = Boolean(range.start || range.end);
  const rangeLabel =
    range.start && range.end
      ? `${shortDay(range.start)} – ${shortDay(range.end)}`
      : range.start
        ? `Desde ${shortDay(range.start)}`
        : range.end
          ? `Hasta ${shortDay(range.end)}`
          : "Rango de fecha";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (!q || `${a.client_name} ${a.client_phone}`.toLowerCase().includes(q))
    );
  }, [appointments, query, statusFilter]);

  return (
    <>
      <PageHeader
        title="Todas las citas"
        eyebrow={
          loading ? "Cargando…" : `${appointments.length} citas registradas`
        }
        action={
          <Link href="/" className="primary-button">
            <Plus size={18} strokeWidth={1.8} /> Nueva cita
          </Link>
        }
      />

      <section className="toolbar">
        <label className="search-field">
          <Search size={19} strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
          />
        </label>

        <div className="date-range-control">
          <button
            className={
              rangeActive ? "date-range-button active" : "date-range-button"
            }
            onClick={() => setRangeOpen((o) => !o)}
            aria-expanded={rangeOpen}
            aria-controls="date-range-panel"
          >
            <CalendarDays size={18} strokeWidth={1.8} />
            <span>{rangeLabel}</span>
            <ChevronRight size={15} strokeWidth={1.8} />
          </button>
          {rangeOpen && (
            <div className="date-range-panel" id="date-range-panel">
              <div className="date-range-heading">
                <div>
                  <strong>Filtrar por fecha</strong>
                  <span>Selecciona un período de citas</span>
                </div>
                {rangeActive && (
                  <button
                    className="clear-range"
                    onClick={() => {
                      setRange({ start: "", end: "" });
                      setQuickRange(null);
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="quick-ranges" aria-label="Rangos rápidos">
                {([30, 15, 7] as const).map((days) => (
                  <button
                    key={days}
                    className={quickRange === days ? "selected" : ""}
                    onClick={() => selectQuickRange(days)}
                  >
                    Próx. {days} días
                  </button>
                ))}
              </div>
              <div className="date-inputs">
                <label>
                  <span>Desde</span>
                  <input
                    type="date"
                    value={range.start}
                    max={range.end || undefined}
                    onChange={(e) => {
                      const start = e.target.value;
                      setRange((r) => ({ ...r, start }));
                      setQuickRange(null);
                    }}
                  />
                </label>
                <label>
                  <span>Hasta</span>
                  <input
                    type="date"
                    value={range.end}
                    min={range.start || undefined}
                    onChange={(e) => {
                      const end = e.target.value;
                      setRange((r) => ({ ...r, end }));
                      setQuickRange(null);
                    }}
                  />
                </label>
              </div>
              <button
                className="primary-button full"
                onClick={() => setRangeOpen(false)}
              >
                Aplicar rango
              </button>
            </div>
          )}
        </div>

        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={statusFilter === f.value ? "selected" : ""}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="alert alert-error">{error}</p>}

      <section className="appointments-table">
        <div className="table-head">
          <span>Fecha y hora</span>
          <span>Cliente</span>
          <span>Teléfono</span>
          <span>Estado</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <Search size={28} strokeWidth={1.8} />
            <strong>No encontramos citas</strong>
            <span>Prueba con otro nombre, teléfono, estado o rango de fecha.</span>
          </div>
        ) : (
          visible.map((a) => (
            <article className="table-row" key={a.id}>
              <div className="date-cell">
                <span>{dayTag(a.appointment_date, todayKey)}</span>
                <div>
                  <strong>{shortDay(a.appointment_date)}</strong>
                  <small>{formatTime(a.appointment_time)}</small>
                </div>
              </div>
              <div className="person-cell">
                <div className="client-avatar small">
                  {initials(a.client_name)}
                </div>
                <div>
                  <strong>{a.client_name}</strong>
                  <small>{a.client_phone}</small>
                </div>
              </div>
              <a
                href={waLink(a.client_phone)}
                target="_blank"
                rel="noreferrer"
                className="service-cell phone-link"
              >
                {a.client_phone}
              </a>
              <label className="status-select">
                <StatusPill status={a.status} />
                <select
                  aria-label={`Estado de la cita de ${a.client_name}`}
                  value={a.status}
                  disabled={updating === a.id}
                  onChange={(e) =>
                    setStatus(a.id, e.target.value as AppointmentStatus)
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))
        )}
      </section>
    </>
  );
}
