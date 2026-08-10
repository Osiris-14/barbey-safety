"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Phone,
  Scissors,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  MONTH_NAMES,
  TIME_SLOTS,
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatLongDate,
  formatTime,
  normalizeTime,
  toDateKey,
} from "@/lib/schedule";

type SlotMap = Record<string, string[]>; // dateKey → ["09:30", ...]

/** Arma un texto legible con lo que devuelve PostgREST (code, message, details, hint) */
function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
    };
    const parts = [
      e.code ? `[${e.code}]` : null,
      e.message ?? null,
      e.details ?? null,
      e.hint ?? null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" · ");
  }
  return String(err);
}

const STEPS = ["Fecha", "Hora", "Tus datos"];

export default function BookingPage() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  const [step, setStep] = useState(1);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [booked, setBooked] = useState<SlotMap>({});
  const [blocked, setBlocked] = useState<SlotMap>({});
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    name: string;
    phone: string;
    date: string;
    time: string;
  } | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  /**
   * Carga citas y bloqueos del mes visible.
   * Si Supabase falla, no mostramos error: caemos en modo optimista
   * (todo disponible) y dejamos el detalle en la consola.
   */
  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    const from = toDateKey(new Date(year, month, 1));
    const to = toDateKey(new Date(year, month + 1, 0));

    try {
      const [appts, blocks] = await Promise.all([
        supabase
          .from("appointments")
          .select("appointment_date, appointment_time")
          .gte("appointment_date", from)
          .lte("appointment_date", to),
        supabase
          .from("blocked_slots")
          .select("slot_date, slot_time")
          .gte("slot_date", from)
          .lte("slot_date", to),
      ]);

      if (appts.error) throw appts.error;
      if (blocks.error) throw blocks.error;

      const bookedMap: SlotMap = {};
      for (const row of appts.data ?? []) {
        const key = row.appointment_date as string;
        (bookedMap[key] ??= []).push(
          normalizeTime(row.appointment_time as string)
        );
      }

      const blockedMap: SlotMap = {};
      for (const row of blocks.data ?? []) {
        const key = row.slot_date as string;
        (blockedMap[key] ??= []).push(normalizeTime(row.slot_time as string));
      }

      setBooked(bookedMap);
      setBlocked(blockedMap);
    } catch (err) {
      console.error(
        "[disponibilidad] no se pudo leer appointments/blocked_slots:",
        err
      );
      // Sin datos = sin ocupaciones conocidas: el mes queda todo libre.
      setBooked({});
      setBlocked({});
    } finally {
      setLoadingMonth(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  /**
   * Refresca un solo día justo antes de mostrar los horarios.
   * Mismo criterio que loadMonth: si falla, el día se muestra libre.
   */
  const refreshDay = useCallback(async (dateKey: string) => {
    setLoadingDay(true);

    try {
      const [appts, blocks] = await Promise.all([
        supabase
          .from("appointments")
          .select("appointment_time")
          .eq("appointment_date", dateKey),
        supabase
          .from("blocked_slots")
          .select("slot_time")
          .eq("slot_date", dateKey),
      ]);

      if (appts.error) throw appts.error;
      if (blocks.error) throw blocks.error;

      setBooked((prev) => ({
        ...prev,
        [dateKey]: (appts.data ?? []).map((r) =>
          normalizeTime(r.appointment_time as string)
        ),
      }));
      setBlocked((prev) => ({
        ...prev,
        [dateKey]: (blocks.data ?? []).map((r) =>
          normalizeTime(r.slot_time as string)
        ),
      }));
    } catch (err) {
      console.error(`[disponibilidad] no se pudo leer el día ${dateKey}:`, err);
      setBooked((prev) => ({ ...prev, [dateKey]: [] }));
      setBlocked((prev) => ({ ...prev, [dateKey]: [] }));
    } finally {
      setLoadingDay(false);
    }
  }, []);

  const takenOn = useCallback(
    (dateKey: string) =>
      new Set([...(booked[dateKey] ?? []), ...(blocked[dateKey] ?? [])]),
    [booked, blocked]
  );

  /**
   * No hay días cerrados por regla fija: los bloqueos salen únicamente de
   * blocked_slots. Solo se descartan las fechas ya pasadas y los días cuyos
   * turnos están todos ocupados o bloqueados.
   */
  const isDayDisabled = useCallback(
    (date: Date) => {
      const key = toDateKey(date);
      if (key < todayKey) return true; // pasado
      return takenOn(key).size >= TIME_SLOTS.length; // día completo
    },
    [todayKey, takenOn]
  );

  const canGoPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1);

  const handlePickDate = async (date: Date) => {
    const key = toDateKey(date);
    setSelectedDate(key);
    setSelectedTime(null);
    setStep(2);
    await refreshDay(key);
  };

  const handlePickTime = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  // El input guarda solo los 10 dígitos; el +1 se antepone al guardar.
  const phoneValid = /^\d{10}$/.test(phone);
  const nameValid = name.trim().length >= 3;
  const fullPhone = `+1${phone}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !nameValid || !phoneValid) return;

    setSubmitting(true);
    setError(null);

    // Última verificación por si alguien reservó mientras el cliente escribía.
    // Si la consulta falla seguimos adelante: el INSERT es la validación real.
    try {
      const { data: clash, error: clashError } = await supabase
        .from("appointments")
        .select("id")
        .eq("appointment_date", selectedDate)
        .eq("appointment_time", selectedTime)
        .limit(1);

      if (clashError) throw clashError;

      if (clash && clash.length > 0) {
        setError("Ese horario acaba de ser ocupado. Elige otro, por favor.");
        setSubmitting(false);
        setSelectedTime(null);
        setStep(2);
        await refreshDay(selectedDate);
        return;
      }
    } catch (err) {
      console.error("[cita] no se pudo verificar el horario:", err);
    }

    // Columnas exactas de la tabla appointments.
    // appointment_date: 'YYYY-MM-DD' · appointment_time: 'HH:MM:SS'
    const payload = {
      client_name: name.trim(),
      client_phone: fullPhone, // "+18295092814"
      appointment_date: selectedDate,
      appointment_time: `${selectedTime}:00`,
      status: "pending",
    };

    // Aquí sí avisamos: callar un fallo le haría creer que quedó agendado.
    try {
      console.log("[cita] INSERT appointments:", payload);

      const { data, error: insertError } = await supabase
        .from("appointments")
        .insert(payload)
        .select();

      if (insertError) throw insertError;

      console.log("[cita] guardada:", data);
    } catch (err) {
      console.error("[cita] falló el INSERT en appointments:", err, {
        payload,
      });
      setError(`No pudimos guardar tu cita. ${describeError(err)}`);
      setSubmitting(false);
      return;
    }

    // Notificación por WhatsApp (aún inactiva)
    fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: fullPhone,
        message: `Hola ${name.trim()}, tu cita en Yoan BarberShop quedó agendada para el ${formatLongDate(
          selectedDate
        )} a las ${formatTime(selectedTime)}.`,
      }),
    }).catch(() => {});

    setDone({
      name: name.trim(),
      phone: fullPhone,
      date: selectedDate,
      time: selectedTime,
    });
    setSubmitting(false);
  };

  const resetAll = () => {
    setDone(null);
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setName("");
    setPhone("");
    setError(null);
    loadMonth();
  };

  /* ---------------------------- Pantalla de éxito --------------------------- */

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night px-4 py-8 sm:py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-edge bg-surface p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">¡Cita agendada!</h1>
          <p className="mt-2 text-sm text-content/60">
            Te esperamos en Yoan BarberShop.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl border border-edge bg-surface-2 p-5 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-content/50">Cliente</dt>
              <dd className="font-medium">{done.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-content/50">WhatsApp</dt>
              <dd className="font-medium">{done.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-content/50">Fecha</dt>
              <dd className="text-right font-medium capitalize">
                {formatLongDate(done.date)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-content/50">Hora</dt>
              <dd className="font-medium text-primary">
                {formatTime(done.time)}
              </dd>
            </div>
          </dl>

          <button
            onClick={resetAll}
            className="mt-6 w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
          >
            Agendar otra cita
          </button>
        </div>
      </main>
    );
  }

  /* -------------------------------- Stepper -------------------------------- */

  const takenToday = selectedDate ? takenOn(selectedDate) : new Set<string>();
  const blockedToday = new Set(selectedDate ? blocked[selectedDate] ?? [] : []);
  const bookedToday = new Set(selectedDate ? booked[selectedDate] ?? [] : []);
  const visibleSlots = TIME_SLOTS.filter((t) => !blockedToday.has(t));

  return (
    <main className="flex min-h-screen items-center justify-center bg-night px-4 py-8 sm:py-10">
      <div className="w-full max-w-[420px]">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-edge bg-surface">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Yoan BarberShop
          </h1>
          <p className="mt-1 text-sm text-content/60">Agenda tu cita</p>
        </header>

        {/* Indicador de pasos: círculos unidos por una línea */}
        <div className="mb-10 flex w-full items-center px-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const complete = step > n;
            return (
              <Fragment key={label}>
                {/* Línea conectora: dorada si el paso anterior ya se completó */}
                {i > 0 && (
                  <div
                    className={[
                      "h-px flex-1 transition-colors duration-300",
                      step > i ? "bg-primary" : "bg-edge",
                    ].join(" ")}
                  />
                )}

                <div className="relative flex flex-col items-center">
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                      complete
                        ? "border-primary bg-primary text-night"
                        : active
                          ? "border-primary text-primary"
                          : "border-edge bg-surface text-content/40",
                    ].join(" ")}
                  >
                    {complete ? <Check className="h-4 w-4" /> : n}
                  </div>
                  <span
                    className={[
                      "absolute top-10 whitespace-nowrap text-[11px] transition-colors",
                      active || complete ? "text-content" : "text-content/40",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-4 sm:p-6">
          {error && (
            <p className="mb-4 break-words rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {/* ---------------------------- Paso 1: fecha --------------------------- */}
          {step === 1 && (
            <section>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-primary" />
                Selecciona una fecha
              </div>

              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => setCursor(new Date(year, month - 1, 1))}
                  className="rounded-lg border border-edge p-2 text-content/70 transition hover:text-primary disabled:opacity-30 disabled:hover:text-content/70"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">
                  {MONTH_NAMES[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={() => setCursor(new Date(year, month + 1, 1))}
                  className="rounded-lg border border-edge p-2 text-content/70 transition hover:text-primary"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-content/40">
                {WEEKDAY_LABELS.map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>

              {loadingMonth ? (
                <div className="flex h-56 items-center justify-center text-content/40">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {weeks.flat().map((date, i) => {
                    if (!date) return <span key={`empty-${i}`} />;
                    const key = toDateKey(date);
                    const disabled = isDayDisabled(date);
                    const isToday = key === todayKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        onClick={() => handlePickDate(date)}
                        className={[
                          "aspect-square rounded-lg border text-sm transition",
                          disabled
                            ? "cursor-not-allowed border-transparent text-content/20"
                            : "border-edge bg-surface-2 hover:border-primary hover:text-primary",
                          isToday && !disabled ? "border-primary/60" : "",
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ----------------------------- Paso 2: hora --------------------------- */}
          {step === 2 && selectedDate && (
            <section>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                Selecciona una hora
              </div>
              <p className="mb-4 text-xs capitalize text-content/50">
                {formatLongDate(selectedDate)}
              </p>

              {loadingDay ? (
                <div className="flex h-40 items-center justify-center text-content/40">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : visibleSlots.length === 0 ? (
                <p className="py-10 text-center text-sm text-content/50">
                  No hay horarios disponibles este día.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {visibleSlots.map((slot) => {
                    const taken = bookedToday.has(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={taken}
                        onClick={() => handlePickTime(slot)}
                        className={[
                          "min-h-[44px] rounded-lg border px-1 text-sm transition",
                          taken
                            ? "cursor-not-allowed border-edge/60 text-content/25 line-through"
                            : "border-edge bg-surface-2 hover:border-primary hover:text-primary",
                        ].join(" ")}
                      >
                        {formatTime(slot)}
                      </button>
                    );
                  })}
                </div>
              )}

              {!loadingDay && takenToday.size > 0 && (
                <p className="mt-4 text-xs text-content/40">
                  Los horarios tachados ya están reservados.
                </p>
              )}

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl border border-edge py-3 text-xs text-content/50 transition hover:text-primary sm:w-auto sm:justify-start sm:border-0 sm:py-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Cambiar fecha
              </button>
            </section>
          )}

          {/* ---------------------------- Paso 3: datos --------------------------- */}
          {step === 3 && selectedDate && selectedTime && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-primary" />
                Tus datos
              </div>

              <div className="mb-5 flex items-center justify-between rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm">
                <span className="capitalize text-content/70">
                  {formatLongDate(selectedDate)}
                </span>
                <span className="font-semibold text-primary">
                  {formatTime(selectedTime)}
                </span>
              </div>

              <label className="mb-1.5 block text-xs text-content/60">
                Nombre completo
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                required
                className="mb-4 w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm outline-none transition placeholder:text-content/25 focus:border-primary"
              />

              <label className="mb-1.5 block text-xs text-content/60">
                WhatsApp
              </label>
              <div className="mb-1 flex w-full overflow-hidden rounded-xl border border-edge bg-surface-2 transition focus-within:border-primary">
                <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-edge px-3 text-sm text-content/60">
                  <Phone className="h-4 w-4 text-content/30" />
                  +1
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="809 555 0000"
                  maxLength={10}
                  inputMode="numeric"
                  required
                  className="w-full min-w-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-content/25"
                />
              </div>
              <p
                className={[
                  "mb-5 text-xs",
                  phone.length > 0 && !phoneValid
                    ? "text-red-400"
                    : "text-content/40",
                ].join(" ")}
              >
                10 dígitos, sin el +1.
              </p>

              <button
                type="submit"
                disabled={!nameValid || !phoneValid || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-night transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Agendando…" : "Confirmar cita"}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-edge py-3 text-xs text-content/50 transition hover:text-primary sm:w-auto sm:justify-start sm:border-0 sm:py-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Cambiar hora
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
