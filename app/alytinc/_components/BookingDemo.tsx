"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Scissors } from "lucide-react";

// Todo lo de aquí es de ejemplo y así se rotula: el visitante prueba el flujo sin enviar datos.
const SERVICES = [
  { id: "corte", name: "Corte clásico", meta: "Servicio de ejemplo", price: "RD$ 400" },
  { id: "combo", name: "Corte + barba", meta: "Servicio de ejemplo", price: "RD$ 600" },
  { id: "barba", name: "Arreglo de barba", meta: "Servicio de ejemplo", price: "RD$ 250" },
];
const DAYS = [
  { id: "hoy", label: "Hoy" },
  { id: "man", label: "Mañana" },
  { id: "pas", label: "Pasado" },
];
const TIMES = [
  { t: "10:00", off: false },
  { t: "10:45", off: true },
  { t: "11:30", off: false },
  { t: "12:15", off: false },
  { t: "13:00", off: true },
  { t: "13:45", off: false },
];

export default function BookingDemo() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<string | null>(null);
  const [day, setDay] = useState("hoy");
  const [time, setTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Skeleton breve al cargar los horarios, como pasa en la app real
  useEffect(() => {
    if (step !== 2) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, [step, day]);

  const svc = SERVICES.find((s) => s.id === service);
  const dayLabel = DAYS.find((d) => d.id === day)?.label ?? "";

  const reset = () => {
    setStep(1);
    setService(null);
    setDay("hoy");
    setTime(null);
    setDone(false);
  };

  return (
    <div className="phone">
      <div className="phone-notch" aria-hidden="true"><i /></div>
      <div className="phone-hero">
        <div className="phone-logo" aria-hidden="true"><Scissors size={21} /></div>
        <h3>Tu Barbería</h3>
        <p>Reserva tu cita en menos de un minuto</p>
      </div>
      <div className="phone-body" aria-live="polite">
        {done ? (
          <div className="success">
            <div className="success-ring"><Check size={30} strokeWidth={3} /></div>
            <h4>¡Cita reservada!</h4>
            <p>
              {svc?.name} · {dayLabel} a las {time}. Así lo ve tu cliente: sin crear cuenta y con su aviso por WhatsApp.
            </p>
            <button type="button" className="link-btn" onClick={reset}>Probar de nuevo</button>
          </div>
        ) : (
          <>
            <div className="progress" aria-hidden="true">
              <i className={step >= 1 ? "on" : ""} />
              <i className={step >= 2 ? "on" : ""} />
              <i className={step >= 3 ? "on" : ""} />
            </div>

            {step === 1 && (
              <div className="pane" key="s1">
                <p className="step-title">1. Elige tu servicio</p>
                {SERVICES.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={`svc ${service === s.id ? "sel" : ""}`}
                    aria-pressed={service === s.id}
                    onClick={() => setService(s.id)}
                  >
                    <span><b>{s.name}</b><small>{s.meta}</small></span>
                    <span className="price">{s.price}</span>
                  </button>
                ))}
                <div className="phone-cta">
                  <button type="button" className="btn btn-primary btn-block" disabled={!service} onClick={() => setStep(2)}>
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="pane" key="s2">
                <p className="step-title">2. Día y hora disponibles</p>
                <div className="days" role="group" aria-label="Día">
                  {DAYS.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`day ${day === d.id ? "sel" : ""}`}
                      aria-pressed={day === d.id}
                      onClick={() => { setDay(d.id); setTime(null); }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="times" role="group" aria-label="Hora">
                  {loading
                    ? TIMES.map((x) => <div key={x.t} className="skeleton" />)
                    : TIMES.map((x) => (
                        <button
                          type="button"
                          key={x.t}
                          className={`time ${time === x.t ? "sel" : ""}`}
                          disabled={x.off}
                          aria-pressed={time === x.t}
                          onClick={() => setTime(x.t)}
                        >
                          {x.t}
                        </button>
                      ))}
                </div>
                <p className="demo-note">Las horas tachadas ya están ocupadas o bloqueadas.</p>
                <div className="phone-cta" style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-secondary" aria-label="Volver" onClick={() => setStep(1)}>
                    <ArrowLeft size={17} />
                  </button>
                  <button type="button" className="btn btn-primary btn-block" disabled={!time} onClick={() => setStep(3)}>
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="pane" key="s3">
                <p className="step-title">3. Confirma tu cita</p>
                <div className="summary">
                  <div><span>Servicio</span><b>{svc?.name}</b></div>
                  <div><span>Día</span><b>{dayLabel}</b></div>
                  <div><span>Hora</span><b>{time}</b></div>
                  <div><span>Precio</span><b>{svc?.price}</b></div>
                </div>
                <div className="phone-cta" style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-secondary" aria-label="Volver" onClick={() => setStep(2)}>
                    <ArrowLeft size={17} />
                  </button>
                  <button type="button" className="btn btn-gold btn-block" onClick={() => setDone(true)}>
                    Confirmar cita
                  </button>
                </div>
                <p className="demo-note">Demostración: no se envía ningún dato.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
