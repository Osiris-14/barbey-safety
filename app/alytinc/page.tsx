import type { Metadata, Viewport } from "next";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Link2,
  Lock,
  MessageCircle,
  Plus,
  Scissors,
  ShieldCheck,
  Smartphone,
  Sparkles,
  XCircle,
} from "lucide-react";
import { landingFonts } from "./fonts";
import Logo from "./_components/Logo";
import Nav from "./_components/Nav";
import Reveal from "./_components/Reveal";
import HeroMock from "./_components/HeroMock";
import BookingDemo from "./_components/BookingDemo";
import LeadForm from "./_components/LeadForm";
import StickyCta from "./_components/StickyCta";
import "./alytinc.css";

const TITLE = "Alytinc — Agenda y reservas para barberías y salones";
const DESCRIPTION =
  "Organiza las citas de tu barbería, salón de belleza o centro de uñas: reservas online con tu propio enlace, avisos automáticos por WhatsApp y un panel claro desde tu celular.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "es_DO",
    siteName: "Alytinc",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#326b5b" };

const STRIP = ["Barberías", "Salones de belleza", "Centros de uñas", "Barberos independientes", "Estudios de estética", "Negocios de servicios"];

const PAINS = [
  { before: "Responder cada mensaje para dar una hora", after: "Tus clientes reservan solos desde tu enlace" },
  { before: "Dos personas citadas a la misma hora", after: "Cada horario se valida en el servidor: sin dobles reservas" },
  { before: "Clientes que olvidan su cita", after: "Confirmación y recordatorio automáticos por WhatsApp" },
];

const FAQ = [
  {
    q: "¿Mis clientes tienen que crear una cuenta?",
    a: "No. Reservan desde tu enlace público con su nombre y teléfono. Nada de descargas ni contraseñas para ellos.",
  },
  {
    q: "¿Necesito instalar una aplicación?",
    a: "No hace falta ir a una tienda de apps. Alytinc funciona desde el navegador del celular y puedes añadirlo a tu pantalla de inicio.",
  },
  {
    q: "¿Qué pasa si dos clientes quieren la misma hora?",
    a: "La reserva se valida en el servidor y la base de datos impide dos citas en el mismo horario. Si alguien se te adelanta, el segundo cliente ve que ya no está disponible y elige otra hora.",
  },
  {
    q: "¿Cómo funcionan los avisos de WhatsApp?",
    a: "Al reservar, el cliente recibe su confirmación, y antes de la cita un recordatorio. Salen desde el WhatsApp de tu negocio.",
  },
  {
    q: "¿Puedo bloquear horarios cuando no atiendo?",
    a: "Sí. Bloqueas la fecha y la hora desde tu panel y ese espacio deja de aparecer como disponible para tus clientes.",
  },
  {
    q: "¿Cuánto cuesta y cuánto tarda en activarse?",
    a: "Los precios y las condiciones se presentan al momento de contratar. La activación se coordina contigo: solicita acceso y te escribimos para empezar.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Alytinc",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: DESCRIPTION,
  inLanguage: "es",
};

export default function AlytincLanding() {
  return (
    <div className={`alytinc-root ${landingFonts}`}>
      <noscript>
        <style>{".alytinc-root .reveal{opacity:1!important;transform:none!important}.alytinc-root .wa-float{opacity:1!important}"}</style>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Nav />

      <main id="contenido">
        {/* ── Hero ─────────────────────────────────────── */}
        <section className="hero" id="inicio">
          <div className="blob blob-1" aria-hidden="true" />
          <div className="blob blob-2" aria-hidden="true" />
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow reveal in"><span className="pulse-dot" /> Para barberías, salones y centros de uñas</div>
              <h1>
                Menos tiempo organizando. <span className="hl">Más tiempo creciendo.</span>
              </h1>
              <p className="hero-copy">
                Alytinc ordena las citas de tu negocio: reservas online con tu propio enlace, avisos automáticos por
                WhatsApp y un panel claro que abres desde el celular.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#empezar">
                  Solicitar acceso <ArrowUpRight size={18} aria-hidden="true" />
                </a>
                <a className="btn btn-secondary" href="#demo">
                  Probar la reserva
                </a>
              </div>
              <div className="hero-checks">
                <span><Check size={16} aria-hidden="true" /> Sin descargas para tus clientes</span>
                <span><Check size={16} aria-hidden="true" /> Funciona desde el celular</span>
                <span><Check size={16} aria-hidden="true" /> Activación contigo</span>
              </div>
            </div>
            <HeroMock />
          </div>
        </section>

        {/* ── Franja ───────────────────────────────────── */}
        <div className="strip" aria-hidden="true">
          <div className="strip-track">
            {[...STRIP, ...STRIP].map((s, i) => (
              <span className="strip-item" key={i}><Sparkles size={15} /> {s}</span>
            ))}
          </div>
        </div>

        {/* ── Problema → solución ──────────────────────── */}
        <section className="section">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="kicker">Antes y después</span>
              <h2>Deja de agendar a mano.</h2>
              <p>Lo repetitivo se automatiza para que atiendas a tus clientes, no el teléfono.</p>
            </Reveal>
            <div className="pain-grid">
              {PAINS.map((p, i) => (
                <Reveal key={p.before} delay={i * 110}>
                  <div className="pain">
                    <div className="pain-before"><XCircle size={18} aria-hidden="true" /> <span>{p.before}</span></div>
                    <div className="pain-after"><CheckCircle2 size={18} aria-hidden="true" /> <span>{p.after}</span></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Funciones (bento) ────────────────────────── */}
        <section className="section section-white" id="funciones">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="kicker">Todo en un solo lugar</span>
              <h2>Lo esencial para que tu negocio fluya.</h2>
              <p>Menos coordinación manual para ti y una experiencia más cómoda para tus clientes.</p>
            </Reveal>

            <div className="bento">
              <Reveal className="cell span-3" spotlight>
                <div className="iconbox"><CalendarDays size={23} aria-hidden="true" /></div>
                <h3>Agenda del día, siempre a la mano</h3>
                <p>Consulta las citas de hoy, marca quién asistió y revisa el historial desde tu panel.</p>
                <div className="cell-visual v-rows" aria-hidden="true">
                  <div className="v-row"><time>10:00</time> Carlos M. <span className="tag">Confirmada</span></div>
                  <div className="v-row"><time>10:45</time> Laura P. <span className="tag">Pendiente</span></div>
                  <div className="v-row"><time>11:30</time> José R. <span className="tag">Confirmada</span></div>
                </div>
              </Reveal>

              <Reveal className="cell span-3" delay={100} spotlight>
                <div className="iconbox"><MessageCircle size={23} aria-hidden="true" /></div>
                <h3>Avisos por WhatsApp</h3>
                <p>Cada reserva recibe su confirmación y un recordatorio antes de la hora, sin que escribas nada.</p>
                <div className="cell-visual v-chat" aria-hidden="true">
                  <div className="v-bubble">¡Tu cita está confirmada! 🙌</div>
                  <div className="v-bubble alt">Te esperamos hoy a las 10:00.</div>
                </div>
              </Reveal>

              <Reveal className="cell span-2" spotlight>
                <div className="iconbox"><Link2 size={23} aria-hidden="true" /></div>
                <h3>Tu propio enlace de reservas</h3>
                <p>Compártelo en tus estados y redes para que reserven desde el celular.</p>
                <div className="cell-visual" aria-hidden="true">
                  <div className="v-url">tu-negocio.com <Copy size={15} /></div>
                </div>
              </Reveal>

              <Reveal className="cell span-2" delay={100} spotlight>
                <div className="iconbox"><BarChart3 size={23} aria-hidden="true" /></div>
                <h3>Indicadores a simple vista</h3>
                <p>Citas, asistencia y cancelaciones en un panel ordenado.</p>
                <div className="cell-visual v-bars" aria-hidden="true">
                  {[40, 62, 48, 80, 70, 95].map((h, i) => (
                    <i key={i} style={{ "--h": `${h}%`, "--i": i } as React.CSSProperties} />
                  ))}
                </div>
              </Reveal>

              <Reveal className="cell span-2" delay={200} spotlight>
                <div className="iconbox"><CalendarClock size={23} aria-hidden="true" /></div>
                <h3>Control de tus horarios</h3>
                <p>Bloquea los espacios en los que no atiendes y deja de recibir reservas ahí.</p>
                <div className="cell-visual v-slots" aria-hidden="true">
                  <span>10:00</span><span className="off">10:45</span><span>11:30</span><span className="off">12:15</span>
                </div>
              </Reveal>

              <Reveal className="cell span-2" spotlight>
                <div className="iconbox"><BellRing size={23} aria-hidden="true" /></div>
                <h3>Te avisa en el celular</h3>
                <p>Recibe una notificación cuando entra una cita nueva, incluso con la pantalla bloqueada.</p>
                <div className="cell-visual" aria-hidden="true">
                  <div className="v-push"><BellRing size={18} /> <span><strong>Nueva cita</strong><small>Marco T. · 12:15</small></span></div>
                </div>
              </Reveal>

              <Reveal className="cell span-2" delay={100} spotlight>
                <div className="iconbox"><ShieldCheck size={23} aria-hidden="true" /></div>
                <h3>Sin dobles reservas</h3>
                <p>Si dos clientes eligen la misma hora, solo uno la consigue. Sin cruces ni disculpas.</p>
                <div className="cell-visual" aria-hidden="true">
                  <div className="v-lock"><ShieldCheck size={17} /> Horario validado en servidor</div>
                </div>
              </Reveal>

              <Reveal className="cell span-2" delay={200} spotlight>
                <div className="iconbox"><Lock size={23} aria-hidden="true" /></div>
                <h3>Cancelar con enlace privado</h3>
                <p>Tu cliente cancela desde su confirmación y el horario vuelve a quedar libre al instante.</p>
                <div className="cell-visual" aria-hidden="true">
                  <div className="v-lock"><Lock size={17} /> Solo con su enlace personal</div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Demo interactiva ─────────────────────────── */}
        <section className="section" id="demo">
          <div className="wrap demo-grid">
            <Reveal className="demo-copy">
              <span className="kicker">Pruébalo tú mismo</span>
              <h2>Así de simple reserva tu cliente.</h2>
              <p>Elige un servicio, un horario y confirma. Es una demostración: no se guarda ningún dato.</p>
              <ul className="demo-points">
                <li><span className="tick"><Smartphone size={15} aria-hidden="true" /></span> Pensado para el celular, en tres pasos.</li>
                <li><span className="tick"><Check size={15} aria-hidden="true" /></span> Los horarios ocupados o bloqueados no se pueden elegir.</li>
                <li><span className="tick"><MessageCircle size={15} aria-hidden="true" /></span> Al confirmar, llega su aviso por WhatsApp.</li>
              </ul>
              <a className="btn btn-primary" href="#empezar">
                Quiero esto en mi negocio <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </Reveal>
            <Reveal delay={150}>
              <BookingDemo />
            </Reveal>
          </div>
        </section>

        {/* ── Para quién ───────────────────────────────── */}
        <section className="section section-white" id="para-quien">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="kicker">Hecho para negocios de servicios</span>
              <h2>Tu negocio tiene su propio ritmo. Alytinc lo organiza.</h2>
              <p>Una misma plataforma, con un diseño sencillo y consistente.</p>
            </Reveal>
            <div className="solutions">
              {[
                { icon: Scissors, title: "Barberías", text: "Organiza los turnos, evita confusiones con los horarios y comparte tu enlace de reservas.", tags: ["Agenda diaria", "Recordatorios"] },
                { icon: Sparkles, title: "Salones de belleza", text: "Ten las citas más ordenadas y facilita que tus clientas reserven cuando les convenga.", tags: ["Gestión de citas", "Enlace público"] },
                { icon: Sparkles, title: "Centros de uñas", text: "Gestiona tus horarios y mantén a la vista las reservas que faltan por atender.", tags: ["Disponibilidad", "Avisos automáticos"] },
              ].map((s, i) => (
                <Reveal key={s.title} delay={i * 110}>
                  <article className="solution">
                    <div className="solution-band" />
                    <div className="solution-body">
                      <div className="solution-icon"><s.icon size={26} aria-hidden="true" /></div>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                      <div className="tag-row">{s.tags.map((t) => <span className="tag-pill" key={t}>{t}</span>)}</div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ────────────────────────────── */}
        <section className="section" id="como-funciona">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="kicker">Empieza sin complicarte</span>
              <h2>De tu solicitud a tu primera reserva.</h2>
              <p>Un proceso claro, con acompañamiento durante la activación.</p>
            </Reveal>
            <div className="steps">
              {[
                { t: "Solicita acceso", d: "Déjanos tu nombre, tu WhatsApp y el tipo de negocio. Toma menos de un minuto." },
                { t: "Configuramos tu agenda", d: "Revisamos contigo tus horarios y los datos básicos para recibir las primeras reservas." },
                { t: "Prueba el flujo", d: "Compruebas el enlace, la confirmación de la cita y los avisos antes de empezar." },
                { t: "Comparte tu enlace", d: "Lo publicas en tus estados y redes para que tus clientes te encuentren y reserven." },
              ].map((s, i) => (
                <Reveal key={s.t} delay={i * 120}>
                  <article className="step">
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Confianza ────────────────────────────────── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <Reveal>
              <div className="trust">
                <div>
                  <span className="kicker">Tu negocio merece claridad</span>
                  <h2>Una agenda más ordenada empieza con un solo lugar.</h2>
                  <p>
                    Organiza tus citas, facilita las reservas y mantén a tus clientes informados, con una experiencia
                    pensada para el día a día.
                  </p>
                </div>
                <div className="trust-points">
                  {[
                    "Panel fácil de entender",
                    "Acceso desde el celular",
                    "Enlace listo para compartir",
                    "Datos de clientes protegidos",
                  ].map((t) => (
                    <div className="trust-point" key={t}><Check size={18} aria-hidden="true" /> {t}</div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Preguntas frecuentes ─────────────────────── */}
        <section className="section section-white" id="preguntas">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="kicker">Preguntas frecuentes</span>
              <h2>Lo que más nos preguntan.</h2>
            </Reveal>
            <div className="faq">
              {FAQ.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <details>
                    <summary>
                      {f.q}
                      <Plus size={20} aria-hidden="true" />
                    </summary>
                    <p className="answer">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA + formulario ─────────────────────────── */}
        <section className="cta" id="empezar">
          <div className="wrap cta-grid">
            <Reveal className="cta-copy">
              <span className="kicker">Conoce Alytinc</span>
              <h2>Haz que reservar una cita sea más sencillo.</h2>
              <p>
                Cuéntanos de tu negocio y te escribimos por WhatsApp para coordinar una demostración y la activación de
                tu agenda.
              </p>
              <ul className="cta-list">
                <li><Check size={18} aria-hidden="true" /> Sin costo por solicitar acceso</li>
                <li><Check size={18} aria-hidden="true" /> Te acompañamos en la configuración</li>
                <li><Check size={18} aria-hidden="true" /> Precios y condiciones al contratar</li>
              </ul>
            </Reveal>
            <Reveal delay={150}>
              <LeadForm />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
            <Logo />
            <small>Organiza tus citas. Cuida la experiencia de tus clientes.</small>
          </div>
          <nav className="footer-links" aria-label="Pie de página">
            <a href="#funciones">Funciones</a>
            <a href="#para-quien">Negocios</a>
            <a href="#preguntas">Preguntas</a>
            <a href="#empezar">Contacto</a>
            <a href="/admin/login">Iniciar sesión</a>
          </nav>
        </div>
      </footer>

      <StickyCta />
    </div>
  );
}
