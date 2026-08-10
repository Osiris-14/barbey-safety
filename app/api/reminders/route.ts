import { supabase, type Appointment } from "@/lib/supabase";
import { formatTime } from "@/lib/schedule";
import { sendWhatsApp, wasSent } from "@/lib/whatsapp";

// El cron debe ejecutar la lógica siempre, nunca servir una respuesta cacheada.
export const dynamic = "force-dynamic";

/** República Dominicana: UTC-4 todo el año, sin horario de verano */
const RD_OFFSET_MS = 4 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/** Instante desplazado a hora RD; se lee con los getters UTC */
function toRdClock(date: Date): Date {
  return new Date(date.getTime() - RD_OFFSET_MS);
}

const dateKey = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const timeKey = (d: Date) =>
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;

export async function GET() {
  const nowRd = toRdClock(new Date());

  // Ventana de 15 a 20 minutos por delante. El cron corre cada minuto, y
  // reminder_sent evita que una cita reciba el aviso más de una vez.
  const from = new Date(nowRd.getTime() + 15 * 60 * 1000);
  const to = new Date(nowRd.getTime() + 20 * 60 * 1000);

  // La fecha sale de `from`, no de `nowRd`: si la ventana cruza medianoche,
  // buscamos en el día al que pertenecen las citas.
  const today = dateKey(from);
  const fromTime = timeKey(from);
  const toTime = timeKey(to);

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("reminder_sent", false)
    .eq("status", "pending")
    .eq("appointment_date", today)
    .gte("appointment_time", fromTime)
    .lte("appointment_time", toTime);

  if (error) {
    console.error("[recordatorios] no se pudieron leer las citas:", error);
    return Response.json(
      { sent: 0, error: error.message },
      { status: 500 }
    );
  }

  const pending = (data ?? []) as Appointment[];
  let sent = 0;

  for (const appointment of pending) {
    try {
      const result = await sendWhatsApp(
        appointment.client_phone,
        `⏰ Recordatorio: Hola ${appointment.client_name}, tu cita en *Yoan BarberShop* es en 15 minutos a las *${formatTime(
          appointment.appointment_time
        )}*. ¡Te esperamos!`
      );

      if (!wasSent(result)) {
        console.error(
          `[recordatorios] UltraMsg rechazó la cita ${appointment.id}:`,
          result
        );
        continue;
      }

      // Solo marcamos tras un envío confirmado; si falla, el cron reintenta.
      const { error: flagError } = await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", appointment.id);

      if (flagError) {
        console.error(
          `[recordatorios] no se pudo marcar reminder_sent en ${appointment.id}:`,
          flagError
        );
      }

      sent++;
    } catch (err) {
      console.error(
        `[recordatorios] error enviando la cita ${appointment.id}:`,
        err
      );
    }
  }

  console.log(
    `[recordatorios] ventana ${today} ${fromTime}–${toTime} · encontradas ${pending.length} · enviadas ${sent}`
  );

  return Response.json({ sent });
}
