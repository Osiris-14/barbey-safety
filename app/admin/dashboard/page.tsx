"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarX,
  Check,
  Loader2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { Appointment } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import { formatTime, normalizeTime, toDateKey } from "@/lib/schedule";
import { PageHeader, rdTodayKey } from "../_components/admin-ui";

type Period = "Hoy" | "Semana" | "Mes";
type Row = Pick<
  Appointment,
  | "id"
  | "client_name"
  | "client_phone"
  | "appointment_date"
  | "appointment_time"
  | "status"
  | "created_at"
>;

const COLUMNS =
  "id, client_name, client_phone, appointment_date, appointment_time, status, created_at";
const PAGE_SIZE = 1000; // tope por consulta de Supabase

const PREVIOUS_LABEL: Record<Period, string> = {
  Hoy: "ayer",
  Semana: "la semana anterior",
  Mes: "el mes anterior",
};

const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAYS_PLURAL = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
  "domingos",
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 0 = lunes … 6 = domingo */
function mondayIndex(key: string): number {
  return (keyToDate(key).getDay() + 6) % 7;
}

/** Rango [inicio, fin] del período actual y del anterior, como YYYY-MM-DD */
function periodRanges(period: Period, today: Date) {
  if (period === "Hoy") {
    const t = toDateKey(today);
    const y = toDateKey(addDays(today, -1));
    return { current: [t, t], previous: [y, y] };
  }
  if (period === "Semana") {
    const monday = addDays(today, -((today.getDay() + 6) % 7));
    return {
      current: [toDateKey(monday), toDateKey(addDays(monday, 6))],
      previous: [toDateKey(addDays(monday, -7)), toDateKey(addDays(monday, -1))],
    };
  }
  const y = today.getFullYear();
  const m = today.getMonth();
  return {
    current: [toDateKey(new Date(y, m, 1)), toDateKey(new Date(y, m + 1, 0))],
    previous: [toDateKey(new Date(y, m - 1, 1)), toDateKey(new Date(y, m, 0))],
  };
}

const inRange = (rows: Row[], [start, end]: string[]) =>
  rows.filter((r) => r.appointment_date >= start && r.appointment_date <= end);

/** Asistieron / (asistieron + no asistieron). null si nadie se marcó aún */
function attendanceRate(rows: Row[]): number | null {
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const marked = confirmed + rows.filter((r) => r.status === "no_show").length;
  return marked ? Math.round((confirmed / marked) * 100) : null;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Barras del gráfico según el período */
function chartData(period: Period, rows: Row[], today: Date) {
  if (period === "Hoy") {
    // Ventanas de 2 horas desde las 9 AM
    const labels = ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "9 PM", "11 PM"];
    const values = labels.map(() => 0);
    rows.forEach((r) => {
      const h = Number(normalizeTime(r.appointment_time).slice(0, 2));
      const i = Math.min(Math.max(Math.floor((h - 9) / 2), 0), 7);
      values[i]++;
    });
    return { labels, values };
  }
  if (period === "Semana") {
    const values = WEEKDAYS_SHORT.map(() => 0);
    rows.forEach((r) => values[mondayIndex(r.appointment_date)]++);
    return { labels: WEEKDAYS_SHORT, values };
  }
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const weeks = Math.ceil(daysInMonth / 7);
  const labels = Array.from({ length: weeks }, (_, i) => `Sem ${i + 1}`);
  const values = labels.map(() => 0);
  rows.forEach((r) => {
    const day = Number(r.appointment_date.slice(8, 10));
    values[Math.floor((day - 1) / 7)]++;
  });
  return { labels, values };
}

/** "Hace 18 minutos" a partir del created_at */
function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Ayer" : `Hace ${days} días`;
}

/** Día de la semana con más citas frente al promedio de los demás */
function weekdayInsight(rows: Row[]) {
  if (rows.length < 10) return null;
  const counts = WEEKDAYS_PLURAL.map(() => 0);
  rows.forEach((r) => counts[mondayIndex(r.appointment_date)]++);
  const best = counts.indexOf(Math.max(...counts));
  const others = counts.filter((c, i) => i !== best && c > 0);
  if (!others.length) return null;
  const avg = others.reduce((a, b) => a + b, 0) / others.length;
  return {
    day: WEEKDAYS_PLURAL[best],
    lift: Math.round((counts[best] / avg - 1) * 100),
  };
}

async function fetchRange(start: string, end: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAuth
      .from("appointments")
      .select(COLUMNS)
      .gte("appointment_date", start)
      .lte("appointment_date", end)
      .order("appointment_date", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export default function DashboardPage() {
  // Medianoche local del día de hoy en RD: así los rangos no se corren de día
  const today = useMemo(() => keyToDate(rdTodayKey()), []);
  const [period, setPeriod] = useState<Period>("Mes");
  const [rows, setRows] = useState<Row[]>([]);
  const [recent, setRecent] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Una sola carga cubre los tres períodos y sus anteriores
  const load = useCallback(async () => {
    const all = (["Hoy", "Semana", "Mes"] as const).flatMap((p) => {
      const r = periodRanges(p, today);
      return [...r.current, ...r.previous];
    });
    const start = all.reduce((a, b) => (a < b ? a : b));
    const end = all.reduce((a, b) => (a > b ? a : b));

    try {
      const [range, latest] = await Promise.all([
        fetchRange(start, end),
        supabaseAuth
          .from("appointments")
          .select(COLUMNS)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (latest.error) throw latest.error;
      setRows(range);
      setRecent((latest.data ?? []) as Row[]);
      setError(null);
    } catch (err) {
      console.error("[dashboard] no se pudieron cargar las métricas:", err);
      setError("No pudimos cargar las métricas.");
    }
    setLoading(false);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  // Una cita cancelada igual se agendó: cuenta en el total y se muestra
  // aparte en su propia tarjeta
  const ranges = periodRanges(period, today);
  const current = inRange(rows, ranges.current);
  const previous = inRange(rows, ranges.previous);
  const cancelled = current.filter((r) => r.status === "cancelled").length;

  const total = current.length;
  const clients = new Set(
    current.filter((r) => r.status === "confirmed").map((r) => r.client_phone)
  ).size;
  const rate = attendanceRate(current);
  const prevRate = attendanceRate(previous);
  const noShow = current.filter((r) => r.status === "no_show").length;
  const pending = current.filter((r) => r.status === "pending").length;

  const metrics = [
    {
      label: "Citas agendadas",
      value: String(total),
      detail: `${signed(total - previous.length)} vs ${PREVIOUS_LABEL[period]}`,
      icon: CalendarDays,
      tone: "gold",
      positive: total >= previous.length,
    },
    {
      label: "Clientes atendidos",
      value: String(clients),
      detail: "Clientes distintos que asistieron",
      icon: Users,
      tone: "neutral",
      positive: false,
    },
    {
      label: "Tasa de asistencia",
      value: rate === null ? "—" : `${rate}%`,
      detail:
        rate !== null && prevRate !== null
          ? `${signed(rate - prevRate)} pts vs ${PREVIOUS_LABEL[period]}`
          : "Según las citas ya marcadas",
      icon: Check,
      tone: "green",
      positive: rate !== null && prevRate !== null && rate >= prevRate,
    },
    {
      label: "No asistieron",
      value: String(noShow),
      detail: `${pending} ${pending === 1 ? "cita pendiente" : "citas pendientes"}`,
      icon: X,
      tone: "neutral",
      positive: false,
    },
    {
      label: "Canceladas",
      value: String(cancelled),
      detail: total
        ? `${Math.round((cancelled / total) * 100)}% de las agendadas`
        : "Sin citas en este período",
      icon: CalendarX,
      tone: "neutral",
      positive: false,
    },
  ];

  const chart = chartData(period, current, today);
  const chartMax = Math.max(...chart.values, 1);

  const slotCounts = new Map<string, number>();
  current.forEach((r) => {
    const t = normalizeTime(r.appointment_time);
    slotCounts.set(t, (slotCounts.get(t) ?? 0) + 1);
  });
  const topSlots = Array.from(slotCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4);
  const topMax = topSlots[0]?.[1] ?? 1;

  const insight = weekdayInsight(rows);

  return (
    <>
      <PageHeader
        title="Dashboard"
        eyebrow="Resumen del negocio"
        action={
          <div className="period-switch" aria-label="Período de métricas">
            {(["Hoy", "Semana", "Mes"] as const).map((p) => (
              <button
                key={p}
                className={period === p ? "selected" : ""}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : (
        <>
          <section className="metric-grid">
            {metrics.map(({ label, value, detail, icon: Icon, tone, positive }) => (
              <article className="metric-card" key={label}>
                <div className={`metric-icon ${tone}`}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <p>{label}</p>
                <strong>{value}</strong>
                <span className={positive ? "positive" : ""}>{detail}</span>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="analytics-card">
              <div className="analytics-heading">
                <div>
                  <h2>Actividad de citas</h2>
                  <p>Citas agendadas en este período</p>
                </div>
                <div className="chart-total">
                  <span>Total de reservas</span>
                  <strong>{total}</strong>
                </div>
              </div>
              <div className="bar-chart">
                {chart.values.map((value, i) => (
                  <div className="bar-column" key={chart.labels[i]}>
                    <div
                      className="bar-track"
                      title={`${chart.labels[i]}: ${value} citas`}
                    >
                      {value > 0 && (
                        <b style={{ bottom: `calc(${(value / chartMax) * 92}% + 4px)` }}>
                          {value}
                        </b>
                      )}
                      <i
                        style={{
                          height: value ? `${(value / chartMax) * 92}%` : 0,
                          minHeight: value ? undefined : 0,
                        }}
                      />
                    </div>
                    <span>{chart.labels[i]}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="analytics-card service-card">
              <div className="analytics-heading">
                <div>
                  <h2>Horarios más pedidos</h2>
                  <p>Por número de reservas</p>
                </div>
              </div>
              {topSlots.length === 0 ? (
                <p className="analytics-empty">Sin citas en este período.</p>
              ) : (
                <div className="service-list">
                  {topSlots.map(([slot, count], index) => (
                    <div className="service-stat" key={slot}>
                      <div>
                        <span>
                          <i>{index + 1}</i>
                          {formatTime(slot)}
                        </span>
                        <strong>{count}</strong>
                      </div>
                      <div className="progress-track">
                        <i style={{ width: `${(count / topMax) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="dashboard-bottom">
            <article className="analytics-card">
              <div className="analytics-heading">
                <div>
                  <h2>Actividad reciente</h2>
                  <p>Últimas reservas recibidas</p>
                </div>
              </div>
              {recent.length === 0 ? (
                <p className="analytics-empty">Todavía no hay reservas.</p>
              ) : (
                <div className="activity-list">
                  {recent.map((r) => (
                    <div key={r.id}>
                      <span
                        className={`activity-dot ${
                          r.status === "confirmed"
                            ? "green"
                            : r.status === "pending"
                              ? "gold"
                              : ""
                        }`}
                      >
                        {r.status === "confirmed" ? (
                          <Check size={14} strokeWidth={1.8} />
                        ) : r.status === "no_show" || r.status === "cancelled" ? (
                          <X size={14} strokeWidth={1.8} />
                        ) : (
                          <CalendarDays size={14} strokeWidth={1.8} />
                        )}
                      </span>
                      <p>
                        <span>
                          <strong>{r.client_name}</strong>{" "}
                          {r.status === "cancelled"
                            ? "reservó y luego canceló"
                            : "reservó una cita"}
                        </span>
                        <small>
                          {timeAgo(r.created_at)} · para el{" "}
                          {keyToDate(r.appointment_date).toLocaleDateString(
                            "es-DO",
                            { weekday: "short", day: "numeric", month: "short" }
                          )}
                          , {formatTime(r.appointment_time)}
                        </small>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="insight-card">
              <span className="insight-label">TENDENCIA</span>
              <TrendingUp size={28} strokeWidth={1.8} />
              {insight ? (
                <>
                  <h2>Los {insight.day} son tus días más fuertes</h2>
                  <p>
                    {insight.lift > 0
                      ? `Recibes un ${insight.lift}% más de citas los ${insight.day} que el promedio de los otros días.`
                      : `Tus citas están repartidas de forma pareja durante la semana.`}
                  </p>
                </>
              ) : (
                <>
                  <h2>Aún estamos aprendiendo tu agenda</h2>
                  <p>
                    Con unas cuantas citas más te mostraremos qué días se
                    llenan primero.
                  </p>
                </>
              )}
            </article>
          </section>
        </>
      )}
    </>
  );
}
