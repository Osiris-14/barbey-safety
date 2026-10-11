"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import {
  formatTime,
  minutesUntil,
} from "@/lib/schedule";
import {
  PageHeader,
  initials,
  rdTodayKey,
  updateAppointmentStatus,
  waLink,
} from "./_components/admin-ui";

// Cada 15 s, y además al volver a la pestaña: así una cancelación del
// cliente aparece sola sin que el barbero tenga que recargar
const POLL_MS = 15_000;

/** Etiqueta bajo la hora: cómo terminó (o va) cada cita */
const TAG_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Asistió",
  no_show: "No asistió",
  cancelled: "Canceló",
};

/** 35 → "En 35 min", 130 → "En 2 h 10 min", -5 → "Hace 5 min" */
function relativeLabel(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const text = h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
  return minutes >= 0 ? `En ${text}` : `Hace ${text}`;
}

export default function AdminTodayPage() {
  const todayKey = useMemo(() => rdTodayKey(), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabaseAuth
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
    const id = setInterval(load, POLL_MS); // citas nuevas y cancelaciones
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [load]);

  /**
   * Las lecturas funcionan como `anon` gracias a la política "leer publico",
   * así que el panel se ve normal aunque no haya sesión — y solo fallan las
   * escrituras. Este aviso hace visible ese estado antes de tocar un botón.
   */
  useEffect(() => {
    supabaseAuth.auth.getUser().then(({ data }) => {
      setSignedIn(data.user !== null);
      if (!data.user) {
        console.error(
          "[citas] el navegador no tiene sesión: los cambios de estado serán rechazados por RLS"
        );
      }
    });
  }, []);

  /** Pinta la fila al instante y revierte si Supabase rechaza el UPDATE */
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

  // Una cita cancelada igual se agendó: cuenta en el total y se informa aparte
  const total = appointments.length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;
  const next = appointments.find((a) => a.status === "pending");
  const nextIndex = next ? appointments.indexOf(next) : -1;

  return (
    <>
      <PageHeader
        title="Día"
        eyebrow="Agenda diaria"
        action={
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={load}
              aria-label="Actualizar citas"
              title="Actualizar"
            >
              <RefreshCw size={18} strokeWidth={1.8} />
            </button>
            <Link href="/" className="primary-button">
              <Plus size={18} strokeWidth={1.8} /> Nueva cita
            </Link>
          </div>
        }
      />

      {signedIn === false && (
        <p className="alert alert-warn">
          No hay sesión activa en este navegador. Puedes ver las citas, pero
          confirmar o marcar ausencias será rechazado. Cierra sesión y vuelve a
          entrar.
        </p>
      )}

      <section className="summary-grid">
        <article className="summary-card featured">
          <p>Próxima cita</p>
          <strong>
            {next ? formatTime(next.appointment_time) : "Sin pendientes"}
          </strong>
          <span>
            {next
              ? `${relativeLabel(
                  minutesUntil(next.appointment_date, next.appointment_time)
                )} · ${next.client_name}`
              : "Tu agenda está al día"}
          </span>
        </article>
        <article className="summary-card">
          <div className="summary-icon gold">
            <CalendarDays size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p>Citas de hoy</p>
            <strong>{total}</strong>
            <span>
              {pending} por atender · {cancelled}{" "}
              {cancelled === 1 ? "cancelada" : "canceladas"}
            </span>
          </div>
        </article>
        <article className="summary-card">
          <div className="summary-icon green">
            <Check size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p>Asistieron</p>
            <strong>{confirmed}</strong>
            <span>{noShow} no asistieron</span>
          </div>
        </article>
      </section>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="section-heading">
        <div>
          <h2>Citas del día</h2>
          <p>Marca la asistencia a medida que avanza el día.</p>
        </div>
        <span className="live-label">
          <i /> EN VIVO
        </span>
      </div>

      <section className="timeline">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={28} strokeWidth={1.8} />
            <strong>No hay citas para hoy</strong>
            <span>Las reservas nuevas aparecerán aquí automáticamente.</span>
          </div>
        ) : (
          appointments.map((a, index) => (
            <article
              key={a.id}
              className={`appointment-row ${
                a.status === "no_show" ? "muted" : a.status === "cancelled" ? "cancelled" : ""
              }`}
            >
              <div className="time-column">
                <strong>{formatTime(a.appointment_time)}</strong>
                <span
                  className={`time-tag tag-${
                    index === nextIndex ? "next" : a.status
                  }`}
                >
                  {index === nextIndex ? "Próxima" : TAG_LABEL[a.status]}
                </span>
              </div>
              <div className="timeline-line">
                <i />
              </div>
              <div className="client-avatar">{initials(a.client_name)}</div>
              <div className="client-info">
                <strong>{a.client_name}</strong>
                <span>
                  <a
                    href={waLink(a.client_phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="phone-link"
                  >
                    {a.client_phone}
                  </a>
                </span>
              </div>
              {a.status === "pending" && (
                <div className="row-actions">
                  <button
                    className="success-button"
                    onClick={() => setStatus(a.id, "confirmed")}
                    disabled={updating === a.id}
                  >
                    <Check size={17} strokeWidth={1.8} /> Asistió
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => setStatus(a.id, "no_show")}
                    disabled={updating === a.id}
                  >
                    <X size={17} strokeWidth={1.8} /> No asistió
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </>
  );
}
