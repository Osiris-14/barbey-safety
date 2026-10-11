import { getSupabaseServer } from "@/lib/supabase-server";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const PHONE_RE = /^\+1\d{10}$/;
const TYPES = ["barberia", "salon", "unas", "otro"] as const;
const TYPE_LABEL: Record<(typeof TYPES)[number], string> = {
  barberia: "Barbería",
  salon: "Salón de belleza",
  unas: "Centro de uñas",
  otro: "Otro",
};
// Máximo de solicitudes por teléfono en 24 h
const MAX_PER_PHONE = 3;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  // Honeypot: si un bot llenó el campo oculto, fingimos éxito y no guardamos nada.
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 100);
  const city = clean(body.city, 80);
  const phone = clean(body.phone, 20);
  const businessType = clean(body.businessType, 20) as (typeof TYPES)[number];

  if (name.length < 3) {
    return Response.json({ ok: false, error: "El nombre no es válido" }, { status: 400 });
  }
  if (!PHONE_RE.test(phone)) {
    return Response.json({ ok: false, error: "El teléfono no es válido" }, { status: 400 });
  }
  if (!TYPES.includes(businessType)) {
    return Response.json({ ok: false, error: "Elige el tipo de negocio" }, { status: 400 });
  }
  if (body.consent !== true) {
    return Response.json({ ok: false, error: "Falta el consentimiento para contactarte" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PER_PHONE) {
      return Response.json(
        { ok: false, error: "Ya recibimos tus solicitudes. Te contactaremos pronto." },
        { status: 429 }
      );
    }

    const { error } = await supabase.from("leads").insert({
      name,
      business_name: businessName || null,
      business_type: businessType,
      phone,
      city: city || null,
      consent: true,
      source: "landing",
    });
    if (error) throw error;

    // Aviso opcional al dueño de Alytinc. Si falla, la solicitud ya quedó guardada.
    const notifyPhone = (process.env.LEADS_NOTIFY_PHONE ?? "").trim();
    if (notifyPhone) {
      try {
        await sendWhatsApp(
          notifyPhone,
          `Nueva solicitud en Alytinc\n${name}${businessName ? ` · ${businessName}` : ""}\n${TYPE_LABEL[businessType]}${city ? ` · ${city}` : ""}\nWhatsApp: ${phone}`
        );
      } catch (notifyError) {
        console.error("[leads] no se pudo avisar por WhatsApp:", notifyError);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[leads] no se pudo guardar la solicitud:", error);
    // 42P01 / PGRST205: la tabla no existe todavía (falta correr scripts/leads.sql)
    const code = (error as { code?: string } | null)?.code;
    if (code === "42P01" || code === "PGRST205") {
      return Response.json(
        { ok: false, error: "El formulario aún no está activado. Escríbenos por WhatsApp." },
        { status: 503 }
      );
    }
    return Response.json(
      { ok: false, error: "No pudimos guardar tu solicitud. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
