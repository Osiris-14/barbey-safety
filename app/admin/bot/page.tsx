"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, CheckCircle2, Info, Loader2, MessageCircle, XCircle } from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-auth";
import { PageHeader, rdTodayKey } from "../_components/admin-ui";

type Status = { configured: boolean; connected: boolean };
type Msg = {
  id: string;
  created_at: string;
  phone: string;
  kind: "confirmation" | "reminder";
  status: "sent" | "failed" | "skipped";
  detail: string | null;
};

const KIND_LABEL: Record<Msg["kind"], string> = {
  confirmation: "Confirmación",
  reminder: "Recordatorio",
};

export default function BotPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [confirmations, setConfirmations] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [saving, setSaving] = useState<"confirmations" | "reminders" | null>(null);
  const [sentToday, setSentToday] = useState(0);
  const [failedToday, setFailedToday] = useState(0);
  const [recent, setRecent] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Estado real de la conexión (UltraMsg). No inventa nada.
    try {
      const res = await fetch("/api/bot/status", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as Status | null;
      if (json) setStatus(json);
    } catch (err) {
      console.error("[bot] no se pudo leer el estado:", err);
    }

    const startOfDay = new Date(`${rdTodayKey()}T00:00:00-04:00`).toISOString();

    const [s, r, today] = await Promise.all([
      supabaseAuth.from("bot_settings").select("*").eq("id", 1).maybeSingle(),
      supabaseAuth
        .from("wa_messages")
        .select("id, created_at, phone, kind, status, detail")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAuth
        .from("wa_messages")
        .select("status")
        .gte("created_at", startOfDay),
    ]);

    if (s.error) {
      const code = (s.error as { code?: string }).code;
      setError(
        code === "42P01" || code === "PGRST205"
          ? "Falta activar el bot: corre scripts/bot.sql en Supabase."
          : "No pudimos cargar la configuración del bot."
      );
    } else {
      setError(null);
      if (s.data) {
        setConfirmations(s.data.confirmations_enabled !== false);
        setReminders(s.data.reminders_enabled !== false);
      }
      setSettingsReady(true);
    }

    if (!r.error && r.data) setRecent(r.data as Msg[]);
    if (!today.error && today.data) {
      const rows = today.data as { status: string }[];
      setSentToday(rows.filter((m) => m.status === "sent").length);
      setFailedToday(rows.filter((m) => m.status === "failed").length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (key: "confirmations" | "reminders", value: boolean) => {
    setSaving(key);
    const { error } = await supabaseAuth
      .from("bot_settings")
      .upsert(
        {
          id: 1,
          confirmations_enabled: key === "confirmations" ? value : confirmations,
          reminders_enabled: key === "reminders" ? value : reminders,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    if (error) {
      console.error("[bot] no se pudo guardar:", error);
      setError(`No pudimos guardar el cambio. ${error.message}`);
    } else if (key === "confirmations") {
      setConfirmations(value);
    } else {
      setReminders(value);
    }
    setSaving(null);
  };

  return (
    <>
      <PageHeader title="Bot" eyebrow="Mensajería de Alytinc" />

      {error && <p className="alert alert-error">{error}</p>}

      <div className="bot-grid">
        <section className="bot-card">
          <div className="card-heading">
            <span className="summary-icon green">
              <MessageCircle size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2>WhatsApp</h2>
              <p>Estado real de tu conexión, leído ahora mismo.</p>
            </div>
          </div>
          {loading || !status ? (
            <div className="loading-state" style={{ minHeight: 90 }}>
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : (
            <p className={`bot-status ${status.connected ? "on" : "off"}`} role="status">
              <i />
              {!status.configured
                ? "WhatsApp no configurado: faltan ULTRAMSG_INSTANCE_ID o ULTRAMSG_TOKEN"
                : status.connected
                  ? "WhatsApp conectado: los avisos están saliendo desde tu número"
                  : "WhatsApp desconectado: revisa la instancia en UltraMsg"}
            </p>
          )}
        </section>

        <section className="bot-card">
          <div className="card-heading">
            <span className="summary-icon gold">
              <Bot size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2>Avisos automáticos</h2>
              <p>Apagar uno detiene esos envíos de verdad.</p>
            </div>
          </div>
          {[
            {
              key: "confirmations" as const,
              title: "Confirmaciones",
              desc: "Se envía al agendar, desde la página de reservas.",
              value: confirmations,
            },
            {
              key: "reminders" as const,
              title: "Recordatorios",
              desc: "Se envía 15 minutos antes de cada cita.",
              value: reminders,
            },
          ].map((t) => (
            <div className="bot-setting" key={t.key}>
              <div className="bot-setting-copy">
                <strong>{t.title}</strong>
                <p>{t.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={t.value}
                aria-label={`Activar ${t.title.toLowerCase()}`}
                className={`toggle-switch ${t.value ? "active" : ""}`}
                disabled={!settingsReady || saving !== null}
                onClick={() => toggle(t.key, !t.value)}
              >
                <span />
              </button>
            </div>
          ))}
        </section>
      </div>

      <div className="bot-grid" style={{ marginTop: 14 }}>
        <section className="bot-card">
          <div className="card-heading">
            <span className="summary-icon green">
              <CheckCircle2 size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2>Hoy</h2>
              <p>Mensajes contados de los envíos reales.</p>
            </div>
          </div>
          <div className="bot-kpis">
            <div>
              <strong>{sentToday}</strong>
              <span>enviados</span>
            </div>
            <div>
              <strong className={failedToday > 0 ? "neg" : ""}>{failedToday}</strong>
              <span>fallidos</span>
            </div>
          </div>
        </section>

        <section className="bot-card">
          <div className="card-heading">
            <span className="summary-icon gold">
              <XCircle size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2>Últimos mensajes</h2>
              <p>Lo último que salió por WhatsApp.</p>
            </div>
          </div>
          {recent.length === 0 ? (
            <p className="link-helper">Todavía no hay mensajes registrados.</p>
          ) : (
            <ul className="bot-history">
              {recent.map((m) => (
                <li key={m.id}>
                  <span
                    className={`bot-dot ${m.status === "sent" ? "ok" : m.status === "failed" ? "bad" : "idle"}`}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{KIND_LABEL[m.kind]} · {m.phone}</strong>
                    <small>
                      {new Date(m.created_at).toLocaleString("es-DO", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {m.status === "failed" && m.detail ? ` · ${m.detail.slice(0, 80)}` : ""}
                      {m.status === "skipped" ? " · omitido" : ""}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="bot-next">
        <Info size={15} strokeWidth={1.8} aria-hidden="true" />
        Las respuestas automáticas a clientes y la bandeja de conversaciones
        llegan en la siguiente etapa, con la conexión oficial de WhatsApp.
      </p>
    </>
  );
}
