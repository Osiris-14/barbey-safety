"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Power, Scissors, Trash2 } from "lucide-react";
import type { Service } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import { PageHeader } from "../_components/admin-ui";

const DURATIONS = [15, 30, 45, 60, 90, 120];

/** "1200" o "1200.50" → "RD$ 1,200.50". Null → "A convenir". */
function formatPrice(price: string | null): string {
  if (price === null) return "A convenir";
  const n = Number(price);
  if (Number.isNaN(n)) return "A convenir";
  return `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(45);
  const [catalogOn, setCatalogOn] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);

  const load = useCallback(async () => {
    const [svc, cfg] = await Promise.all([
      supabaseAuth
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabaseAuth.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    const { data, error } = svc;

    if (error) {
      console.error("[catálogo] no se pudo cargar:", error);
      // 42P01 / PGRST205: falta correr scripts/catalogo.sql
      const code = (error as { code?: string }).code;
      setError(
        code === "42P01" || code === "PGRST205"
          ? "Falta activar el catálogo: corre scripts/catalogo.sql en Supabase."
          : "No pudimos cargar el catálogo."
      );
    } else {
      setError(null);
      setServices((data ?? []) as Service[]);
    }

    if (!cfg.error && cfg.data) {
      setCatalogOn(cfg.data.catalog_enabled === true);
      setSettingsReady(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCatalog = async () => {
    setSavingCatalog(true);
    const { error } = await supabaseAuth
      .from("app_settings")
      .upsert(
        {
          id: 1,
          catalog_enabled: !catalogOn,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    if (error) {
      console.error("[catálogo] no se pudo guardar el interruptor:", error);
      const code = (error as { code?: string }).code;
      setError(
        code === "42P01" || code === "PGRST205"
          ? "Falta la tabla de ajustes: corre scripts/ajustes.sql en Supabase."
          : `No pudimos guardar el cambio. ${error.message}`
      );
    } else {
      setCatalogOn(!catalogOn);
      setSettingsReady(true);
    }
    setSavingCatalog(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.replace(/\s+/g, " ").trim();
    if (cleanName.length < 2) {
      setError("El nombre del servicio es muy corto.");
      return;
    }
    const cleanPrice = price.trim().replace(/,/g, "");
    if (cleanPrice && !/^\d+(\.\d{1,2})?$/.test(cleanPrice)) {
      setError("El precio no es válido. Usa solo números, por ejemplo 500.");
      return;
    }

    setSaving(true);
    setError(null);
    const { error } = await supabaseAuth.from("services").insert({
      name: cleanName.slice(0, 80),
      price: cleanPrice ? Number(cleanPrice) : null,
      duration_min: duration,
      sort_order: services.length,
    });

    if (error) {
      console.error("[catálogo] no se pudo crear:", error);
      setError(`No pudimos crear el servicio. ${error.message}`);
    } else {
      setName("");
      setPrice("");
      await load();
    }
    setSaving(false);
  };

  const handleToggle = async (s: Service) => {
    setWorking(s.id);
    const { error } = await supabaseAuth
      .from("services")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);

    if (error) {
      console.error("[catálogo] no se pudo cambiar el estado:", error);
      setError(`No pudimos actualizar. ${error.message}`);
    } else {
      setServices((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, is_active: !s.is_active } : x))
      );
    }
    setWorking(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este servicio? Las citas que ya lo tienen lo conservan.")) return;
    setWorking(id);
    const { error } = await supabaseAuth.from("services").delete().eq("id", id);

    if (error) {
      console.error("[catálogo] no se pudo eliminar:", error);
      setError(`No pudimos eliminar. ${error.message}`);
    } else {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
    setWorking(null);
  };

  return (
    <>
      <PageHeader title="Catálogo" eyebrow="Servicios y precios" />

      {error && <p className="alert alert-error">{error}</p>}

      <section className="bot-card" style={{ marginBottom: 14 }}>
        <div className="bot-setting" style={{ borderTop: 0, paddingTop: 0 }}>
          <div className="bot-setting-copy">
            <strong>Catálogo activo</strong>
            <p>
              Apagado, la reserva funciona igual que siempre aunque tengas
              servicios creados. Encendido, el cliente elige servicio al reservar.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={catalogOn}
            aria-label="Activar catálogo"
            className={`toggle-switch ${catalogOn ? "active" : ""}`}
            disabled={!settingsReady || savingCatalog}
            onClick={toggleCatalog}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="block-layout">
        <form className="block-form-card" onSubmit={handleCreate}>
          <div className="card-heading">
            <span className="summary-icon gold">
              <Scissors size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2>Nuevo servicio</h2>
              <p>Si no creas ninguno, la reserva sigue igual que hoy.</p>
            </div>
          </div>
          <label className="form-field">
            <span>Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej.: Corte + barba"
              maxLength={80}
              required
            />
          </label>
          <label className="form-field">
            <span>Precio en RD$ <em className="form-optional">(opcional)</em></span>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="Ej.: 500 (vacío = a convenir)"
              inputMode="decimal"
              maxLength={12}
            />
          </label>
          <label className="form-field">
            <span>Duración</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
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
              <Plus size={18} strokeWidth={2} />
            )}
            Agregar servicio
          </button>
          <p className="form-hint">
            Para que el cliente lo vea, enciende el interruptor de arriba.
          </p>
        </form>

        <div>
          <div className="section-heading compact">
            <div>
              <h2>Servicios</h2>
              <p>
                {loading
                  ? "Cargando…"
                  : `${services.length} ${services.length === 1 ? "servicio" : "servicios"}`}
              </p>
            </div>
          </div>
          <div className="block-list">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : services.length === 0 ? (
              <div className="empty-state">
                <Scissors size={28} strokeWidth={1.8} />
                <strong>Sin catálogo</strong>
                <span>La reserva funciona igual que hoy, sin paso extra.</span>
              </div>
            ) : (
              services.map((s) => (
                <article
                  className="block-row"
                  key={s.id}
                  style={s.is_active ? undefined : { opacity: 0.55 }}
                >
                  <div className="block-icon">
                    <Scissors size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <strong>{s.name}</strong>
                    <span>
                      {formatPrice(s.price)} · {s.duration_min} min
                      {!s.is_active && " · pausado"}
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => handleToggle(s)}
                    disabled={working === s.id}
                    aria-label={s.is_active ? `Pausar ${s.name}` : `Activar ${s.name}`}
                    title={s.is_active ? "Pausar (no se ofrece)" : "Activar"}
                  >
                    {working === s.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Power size={18} strokeWidth={1.8} />
                    )}
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => handleDelete(s.id)}
                    disabled={working === s.id}
                    aria-label={`Eliminar ${s.name}`}
                  >
                    <Trash2 size={18} strokeWidth={1.8} />
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
