"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Clock, Loader2, Trash2 } from "lucide-react";
import type { BlockedSlot } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import {
  TIME_SLOTS,
  formatLongDate,
  formatTime,
  normalizeTime,
} from "@/lib/schedule";
import { PageHeader, capitalize, rdTodayKey } from "../_components/admin-ui";

/** Hoy / Mañana / En 3 días */
function daysAway(dateKey: string, todayKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const diff = Math.round(
    (new Date(y, m - 1, d).getTime() - new Date(ty, tm - 1, td).getTime()) /
      86_400_000
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return `En ${diff} días`;
}

export default function BlockedSlotsPage() {
  const todayKey = useMemo(() => rdTodayKey(), []);

  const [slots, setSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState<string>(TIME_SLOTS[0]);

  // Solo los bloqueos de hoy en adelante: los pasados ya no afectan la agenda
  const load = useCallback(async () => {
    const { data, error } = await supabaseAuth
      .from("blocked_slots")
      .select("*")
      .gte("slot_date", todayKey)
      .order("slot_date", { ascending: true })
      .order("slot_time", { ascending: true });

    if (error) {
      console.error("[bloqueos] no se pudieron cargar:", error);
      setError("No pudimos cargar los horarios bloqueados.");
    } else {
      setError(null);
      setSlots((data ?? []) as BlockedSlot[]);
    }
    setLoading(false);
  }, [todayKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    const already = slots.some(
      (s) => s.slot_date === date && normalizeTime(s.slot_time) === time
    );
    if (already) {
      setError("Ese horario ya está bloqueado.");
      return;
    }

    setSaving(true);
    setError(null);
    const { error } = await supabaseAuth
      .from("blocked_slots")
      .insert({ slot_date: date, slot_time: time });

    if (error) {
      console.error("[bloqueos] no se pudo insertar:", error);
      setError(`No pudimos bloquear el horario. ${error.message}`);
    } else {
      await load();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabaseAuth
      .from("blocked_slots")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[bloqueos] no se pudo eliminar:", error);
      setError(`No pudimos eliminar el bloqueo. ${error.message}`);
    } else {
      setSlots((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Disponibilidad" eyebrow="Administra tus horarios" />

      {error && <p className="alert alert-error">{error}</p>}

      <section className="block-layout">
        <form className="block-form-card" onSubmit={handleBlock}>
          <div className="card-heading">
            <span className="summary-icon gold">
              <Ban size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2>Bloquear horario</h2>
              <p>Este espacio dejará de estar disponible para tus clientes.</p>
            </div>
          </div>
          <label className="form-field">
            <span>Fecha</span>
            <input
              type="date"
              value={date}
              min={todayKey}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Hora</span>
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="primary-button full"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Ban size={18} strokeWidth={1.8} />
            )}
            Bloquear este horario
          </button>
          <p className="form-hint">
            Podrás eliminarlo cuando quieras para volver a recibir citas.
          </p>
        </form>

        <div>
          <div className="section-heading compact">
            <div>
              <h2>Próximos bloqueos</h2>
              <p>
                {loading
                  ? "Cargando…"
                  : `${slots.length} ${
                      slots.length === 1
                        ? "horario no disponible"
                        : "horarios no disponibles"
                    }`}
              </p>
            </div>
          </div>
          <div className="block-list">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : slots.length === 0 ? (
              <div className="empty-state">
                <Clock size={28} strokeWidth={1.8} />
                <strong>No hay horarios bloqueados</strong>
                <span>Toda tu agenda está abierta para reservas.</span>
              </div>
            ) : (
              slots.map((s) => (
                <article className="block-row" key={s.id}>
                  <div className="block-icon">
                    <Clock size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <strong>{formatTime(s.slot_time)}</strong>
                    <span>{capitalize(formatLongDate(s.slot_date))}</span>
                  </div>
                  <span className="block-note">
                    {daysAway(s.slot_date, todayKey)}
                  </span>
                  <button
                    className="icon-button danger"
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    aria-label={`Eliminar bloqueo de las ${formatTime(
                      s.slot_time
                    )}`}
                  >
                    {deleting === s.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} strokeWidth={1.8} />
                    )}
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
