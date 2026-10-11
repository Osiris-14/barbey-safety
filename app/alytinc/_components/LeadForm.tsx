"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Scissors, Sparkles, Store } from "lucide-react";

const TYPES = [
  { value: "barberia", label: "Barbería", icon: Scissors },
  { value: "salon", label: "Salón de belleza", icon: Sparkles },
  { value: "unas", label: "Centro de uñas", icon: Sparkles },
  { value: "otro", label: "Otro negocio", icon: Store },
] as const;

type Errors = Partial<Record<"name" | "type" | "phone" | "consent", string>>;

/** Devuelve +1XXXXXXXXXX o null. Acepta "809 555 1234", "(809) 555-1234", "+1 809 555 1234". */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export default function LeadForm() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [type, setType] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot: una persona real no lo ve
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const goStep2 = () => {
    const next: Errors = {};
    if (name.trim().length < 3) next.name = "Escribe tu nombre (mínimo 3 letras).";
    if (!type) next.type = "Elige el tipo de negocio.";
    setErrors(next);
    if (Object.keys(next).length) {
      if (next.name) nameRef.current?.focus();
      return;
    }
    setStep(2);
    setTimeout(() => phoneRef.current?.focus(), 60);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) return goStep2();

    const normalized = normalizePhone(phone);
    const next: Errors = {};
    if (!normalized) next.phone = "Usa un número de 10 dígitos, por ejemplo 809 555 1234.";
    if (!consent) next.consent = "Necesitamos tu permiso para contactarte.";
    setErrors(next);
    if (Object.keys(next).length) {
      if (next.phone) phoneRef.current?.focus();
      return;
    }

    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          businessType: type,
          phone: normalized,
          city: city.trim(),
          consent,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setServerError("No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="form-card" role="status">
        <div className="form-success">
          <div className="success-ring"><Check size={30} strokeWidth={3} /></div>
          <h3>¡Solicitud recibida!</h3>
          <p>
            Gracias, {name.trim().split(" ")[0]}. Te contactaremos por WhatsApp para coordinar la activación de tu agenda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate aria-labelledby="form-title">
      <div className="form-head">
        <h3 id="form-title">Solicita tu acceso</h3>
        <span className="form-step" aria-live="polite">Paso {step} de 2</span>
      </div>

      {/* Campo trampa para bots */}
      <div className="hp" aria-hidden="true">
        <label>
          No llenar
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {step === 1 && (
        <>
          <div className="field">
            <label htmlFor="lead-name">Tu nombre</label>
            <input
              ref={nameRef}
              id="lead-name"
              className="input"
              autoComplete="name"
              placeholder="Ej.: Pedro Martínez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "err-name" : undefined}
              maxLength={100}
            />
            {errors.name && <span id="err-name" className="field-error" role="alert">{errors.name}</span>}
          </div>

          <div className="field">
            <label htmlFor="lead-business">Nombre de tu negocio <span className="opt">(opcional)</span></label>
            <input
              id="lead-business"
              className="input"
              autoComplete="organization"
              placeholder="Ej.: Pedro Barbershop"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={100}
            />
          </div>

          <fieldset className="field" style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
            <legend className="label" style={{ padding: 0, marginBottom: 7 }}>¿Qué tipo de negocio tienes?</legend>
            <div className="type-grid">
              {TYPES.map(({ value, label, icon: Icon }) => (
                <label className="type" key={value}>
                  <input
                    type="radio"
                    name="business-type"
                    value={value}
                    checked={type === value}
                    onChange={() => setType(value)}
                  />
                  <span><Icon size={17} aria-hidden="true" /> {label}</span>
                </label>
              ))}
            </div>
            {errors.type && <span className="field-error" role="alert">{errors.type}</span>}
          </fieldset>

          <button type="submit" className="btn btn-primary btn-block">
            Continuar <ArrowRight size={17} aria-hidden="true" />
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field">
            <label htmlFor="lead-phone">Tu WhatsApp</label>
            <input
              ref={phoneRef}
              id="lead-phone"
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="809 555 1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "err-phone" : undefined}
              maxLength={20}
            />
            {errors.phone && <span id="err-phone" className="field-error" role="alert">{errors.phone}</span>}
          </div>

          <div className="field">
            <label htmlFor="lead-city">Ciudad <span className="opt">(opcional)</span></label>
            <input
              id="lead-city"
              className="input"
              autoComplete="address-level2"
              placeholder="Ej.: Santo Domingo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={80}
            />
          </div>

          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={!!errors.consent}
            />
            <span>Acepto que Alytinc me contacte por WhatsApp para coordinar la activación y la demostración.</span>
          </label>
          {errors.consent && <p className="field-error" role="alert" style={{ marginTop: -10, marginBottom: 14 }}>{errors.consent}</p>}

          {serverError && <div className="form-error" role="alert">{serverError}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" aria-label="Volver al paso 1" onClick={() => setStep(1)}>
              <ArrowLeft size={17} />
            </button>
            <button type="submit" className="btn btn-primary btn-block" disabled={status === "sending"}>
              {status === "sending" ? (<><span className="spinner" aria-hidden="true" /> Enviando…</>) : (<>Enviar solicitud <ArrowRight size={17} aria-hidden="true" /></>)}
            </button>
          </div>
        </>
      )}

      <p className="form-fine">Sin costo por solicitar. Los precios y condiciones se presentan al contratar.</p>
    </form>
  );
}
