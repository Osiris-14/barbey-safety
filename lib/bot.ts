import { getSupabaseServer } from "@/lib/supabase-server";

type ServerClient = ReturnType<typeof getSupabaseServer>;

export type BotSettings = {
  confirmations: boolean;
  reminders: boolean;
};

/**
 * Interruptores del bot (/admin/bot). Si la tabla no existe aún (falta
 * scripts/bot.sql), todo va activado: el comportamiento de siempre.
 */
export async function getBotSettings(
  supabase: ServerClient
): Promise<BotSettings> {
  try {
    const { data, error } = await supabase
      .from("bot_settings")
      .select("confirmations_enabled, reminders_enabled")
      .eq("id", 1)
      .limit(1)
      .maybeSingle();
    if (error || !data) return { confirmations: true, reminders: true };
    return {
      confirmations: data.confirmations_enabled !== false,
      reminders: data.reminders_enabled !== false,
    };
  } catch {
    return { confirmations: true, reminders: true };
  }
}

export type WaLog = {
  phone: string;
  kind: "confirmation" | "reminder";
  status: "sent" | "failed" | "skipped";
  detail?: string;
  appointmentId?: string;
};

/** Bitácora del historial del bot. Best-effort: nunca rompe el envío. */
export async function logWaMessage(
  supabase: ServerClient,
  entry: WaLog
): Promise<void> {
  try {
    await supabase.from("wa_messages").insert({
      phone: entry.phone,
      kind: entry.kind,
      status: entry.status,
      detail: entry.detail ?? null,
      appointment_id: entry.appointmentId ?? null,
    });
  } catch (err) {
    console.error("[bot] no se pudo registrar el mensaje:", err);
  }
}
