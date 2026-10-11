"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Check, MessageCircle } from "lucide-react";

// Datos de ejemplo: la maqueta es ilustrativa y está marcada como tal.
const BASE = [
  { time: "10:00", name: "Carlos M.", service: "Corte", pending: false },
  { time: "10:45", name: "Laura P.", service: "Servicio", pending: true },
  { time: "11:30", name: "José R.", service: "Corte + barba", pending: false },
];
const WEEK = [
  { d: "Lun", n: 7, w: "72%" },
  { d: "Mar", n: 4, w: "46%" },
  { d: "Mié", n: 8, w: "83%" },
  { d: "Jue", n: 5, w: "58%" },
  { d: "Vie", n: 9, w: "95%" },
];

// Línea de tiempo: 0 inicio · 1 entra una reserva · 2 se confirma y sale el aviso · 3 pausa
const STEP_MS = [1800, 2400, 3600, 1600];
const FINAL_STEP = 2;

export default function HeroMock() {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduced) {
      setStep(FINAL_STEP);
      return;
    }
    const t = setTimeout(() => setStep((s) => (s + 1) % STEP_MS.length), STEP_MS[step]);
    return () => clearTimeout(t);
  }, [step, reduced]);

  const hasNew = step >= 1 && step <= 3;
  const confirmed = step >= 2 && step <= 3;
  const total = hasNew ? 9 : 8;
  const pending = hasNew && !confirmed ? 4 : 3;
  const done = confirmed ? 6 : 5;

  return (
    <div className="stage" aria-label="Vista previa ilustrativa del panel de Alytinc" role="img">
      <div className="stage-glow" />
      <div className={`mock ${ready ? "ready" : ""}`}>
        <span className="mock-demo-tag">Datos de ejemplo</span>
        <div className="mock-top">
          <div className="mock-brand">
            <span className="mock-logo"><CalendarDays size={15} /></span>
            Alytinc <span style={{ fontWeight: 500, color: "#6f8178" }}>· Panel del negocio</span>
          </div>
          <span className="mock-chip">● Todo en orden</span>
        </div>
        <div className="mock-welcome">
          <div>
            <h3>Buenos días 👋</h3>
            <p>Este es el resumen de tu negocio</p>
          </div>
          <div className="mock-date">Hoy</div>
        </div>
        <div className="mock-stats">
          <div className="stat">
            <span>Citas de hoy</span>
            <strong key={`t${total}`} className="pop">{String(total).padStart(2, "0")}</strong>
            <em>En agenda</em>
          </div>
          <div className="stat">
            <span>Pendientes</span>
            <strong key={`p${pending}`} className="pop">{String(pending).padStart(2, "0")}</strong>
            <em>Por atender</em>
          </div>
          <div className="stat">
            <span>Confirmadas</span>
            <strong key={`d${done}`} className="pop">{String(done).padStart(2, "0")}</strong>
            <em>● Listas</em>
          </div>
        </div>
        <div className="mock-lower">
          <div className="mock-card chart">
            <h4>Actividad de la semana</h4>
            {WEEK.map((r, i) => (
              <div className="bar-row" key={r.d}>
                <span>{r.d}</span>
                <div className="bar"><i style={{ "--w": r.w, "--i": i } as React.CSSProperties} /></div>
                <b>{r.n}</b>
              </div>
            ))}
          </div>
          <div className="mock-card">
            <h4>Próximas citas</h4>
            <div className="appt-list">
              {BASE.map((a) => (
                <div className="appt" key={a.time}>
                  <span className="appt-time">{a.time}</span>
                  <div>
                    <b>{a.name}</b>
                    <small>{a.service} · {a.pending ? "Pendiente" : "Confirmada"}</small>
                  </div>
                  <span className={`dot ${a.pending ? "pending" : ""}`} />
                </div>
              ))}
              {hasNew && (
                <div className="appt is-new">
                  <span className="appt-time">12:15</span>
                  <div>
                    <b>Marco T.</b>
                    <small>Corte clásico · {confirmed ? "Confirmada" : "Nueva reserva"}</small>
                  </div>
                  <span className={`dot ${confirmed ? "" : "pending"}`} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={`wa-float ${confirmed ? "show" : ""}`} aria-hidden="true">
        <div className="wa-head">
          <span className="wa-circle"><MessageCircle size={15} /></span> Aviso por WhatsApp
        </div>
        <div className="wa-bubble">¡Tu cita está confirmada! Te enviaremos un recordatorio antes de tu hora.</div>
        <div className="wa-time"><Check size={10} style={{ display: "inline", verticalAlign: "-1px" }} /> Mensaje de ejemplo</div>
      </div>
    </div>
  );
}
