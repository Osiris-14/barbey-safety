"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, Trash2 } from "lucide-react";
import { supabase, type BlockedSlot } from "@/lib/supabase";
import {
  TIME_SLOTS,
  formatLongDate,
  formatTime,
  normalizeTime,
  toDateKey,
} from "@/lib/schedule";

export default function BlockedSlotsPage() {
  const [slots, setSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [time, setTime] = useState<string>(TIME_SLOTS[0]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("slot_date", { ascending: true })
      .order("slot_time", { ascending: true });

    if (error) {
      setError("No pudimos cargar los horarios bloqueados.");
    } else {
      setError(null);
      setSlots((data ?? []) as BlockedSlot[]);
    }
    setLoading(false);
  }, []);

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
    const { error } = await supabase
      .from("blocked_slots")
      .insert({ slot_date: date, slot_time: time });

    if (error) {
      setError("No pudimos bloquear el horario.");
    } else {
      await load();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);

    if (error) {
      setError("No pudimos eliminar el bloqueo.");
    } else {
      setSlots((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleting(null);
  };

  // Agrupa por fecha para una lista más legible
  const grouped = slots.reduce<Record<string, BlockedSlot[]>>((acc, s) => {
    (acc[s.slot_date] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold sm:text-2xl">Bloquear horarios</h1>
      <p className="mt-1 text-sm text-content/50">
        Los horarios bloqueados no aparecen disponibles para los clientes.
      </p>

      <form
        onSubmit={handleBlock}
        className="my-6 flex flex-wrap items-end gap-3 rounded-2xl border border-edge bg-surface p-4 sm:p-5"
      >
        <div className="w-full sm:w-auto">
          <label className="mb-1.5 block text-xs text-content/60">Fecha</label>
          <input
            type="date"
            value={date}
            min={toDateKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
            required
            className="min-h-[44px] w-full rounded-xl border border-edge bg-surface-2 px-4 text-sm outline-none transition focus:border-primary sm:w-auto"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="mb-1.5 block text-xs text-content/60">Hora</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-edge bg-surface-2 px-4 text-sm outline-none transition focus:border-primary sm:w-auto"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {formatTime(t)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-night transition hover:brightness-110 disabled:opacity-40 sm:w-auto"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          Bloquear horario
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-content/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge py-16 text-center text-sm text-content/40">
          No hay horarios bloqueados.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([day, daySlots]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs capitalize text-content/40">
                {formatLongDate(day)}
              </h2>
              <ul className="space-y-2">
                {daySlots.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-edge bg-surface px-4 py-3"
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <Ban className="h-4 w-4 text-content/30" />
                      {formatTime(s.slot_time)}
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      aria-label="Eliminar bloqueo"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-edge text-content/50 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                    >
                      {deleting === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
