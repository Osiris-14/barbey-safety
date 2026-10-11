"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Link2, MessageCircle, Share2, Sparkles } from "lucide-react";
import { supabase, type Service } from "@/lib/supabase";
import { isCatalogEnabled } from "@/lib/settings";
import { PageHeader } from "../_components/admin-ui";

function formatPriceShort(price: string | null): string {
  if (price === null || Number.isNaN(Number(price))) return "A convenir";
  return `RD$ ${Number(price).toLocaleString("es-DO", { maximumFractionDigits: 2 })}`;
}

export default function ClientLinkPage() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    setUrl(`${window.location.origin}/`);
    (async () => {
      try {
        // La vista previa muestra servicios solo si el catálogo está activo,
        // igual que lo verá el cliente.
        if (!(await isCatalogEnabled(supabase))) return;
        const { data } = await supabase
          .from("services")
          .select("id, name, price, duration_min")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
          .limit(3);
        if (data) setServices(data as Service[]);
      } catch (err) {
        console.error("[link] no se pudo cargar el catálogo:", err);
      }
    })();
  }, []);

  const copyUrl = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2300);
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Reserva tu próxima cita aquí: ${url}`)}`,
      "_blank"
    );
  };

  return (
    <>
      <PageHeader title="Link cliente" eyebrow="Reservas en línea" />

      <div className="link-grid">
        <div className="link-card">
          <h2>Tu enlace de reservas</h2>
          <p>Compártelo para que tus clientes puedan reservar cuando quieran.</p>

          <label className="form-field" htmlFor="public-url">
            <span>Enlace público del negocio</span>
          </label>
          <div className="url-field">
            <input id="public-url" value={url} readOnly onFocus={(e) => e.target.select()} />
            <button type="button" className="primary-button" onClick={copyUrl}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="link-helper">
            Este enlace pertenece a tu negocio. Tus clientes no necesitan crear
            una cuenta para reservar.
          </p>
          {copied && <p className="link-copied" role="status">Enlace copiado.</p>}

          <div className="share-grid">
            <button type="button" className="share-btn" onClick={shareWhatsApp}>
              <MessageCircle size={19} strokeWidth={1.8} />
              WhatsApp
            </button>
            <button type="button" className="share-btn" onClick={copyUrl}>
              <Link2 size={19} strokeWidth={1.8} />
              Copiar link
            </button>
            <a className="share-btn" href="/" target="_blank" rel="noreferrer">
              <ExternalLink size={19} strokeWidth={1.8} />
              Vista previa
            </a>
          </div>

          <div className="link-tips">
            <h3>Consejos para conseguir más citas</h3>
            <div className="activity-list">
              <div>
                <span className="activity-dot green">
                  <Share2 size={16} strokeWidth={1.8} />
                </span>
                <p>
                  <strong>Publica el enlace en tus estados</strong>
                  <small>Así tus clientes pueden reservar sin tener que escribirte primero.</small>
                </p>
              </div>
              <div>
                <span className="activity-dot gold">
                  <Sparkles size={16} strokeWidth={1.8} />
                </span>
                <p>
                  <strong>Añádelo a tu perfil de Instagram</strong>
                  <small>Usa el enlace en tu biografía y compártelo con nuevos clientes.</small>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="phone-mock" aria-hidden="true">
          <div className="phone-frame">
            <div className="phone-hero">
              <div className="phone-logo">YB</div>
              <h3>Yoan BarberShop</h3>
              <p>Reserva tu próxima cita</p>
            </div>
            <div className="phone-body">
              {services.length > 0 && (
                <>
                  <div className="phone-label">SERVICIOS POPULARES</div>
                  {services.map((s) => (
                    <div className="phone-service" key={s.id}>
                      <span>{s.name}</span>
                      <strong>{formatPriceShort(s.price)}</strong>
                    </div>
                  ))}
                </>
              )}
              <div className="phone-label" style={{ marginTop: services.length ? 14 : 0 }}>
                SELECCIONA TU HORARIO
              </div>
              <div className="phone-service">
                <span>Hoy · 5:00 PM</span>
                <span>›</span>
              </div>
              <div className="phone-cta">Reservar una cita</div>
              <p className="phone-foot">Reservas gestionadas con Alytinc</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
