import { supabase, type Appointment } from "@/lib/supabase";
import { formatTime, rdDateKey, rdNow, rdTimeKey } from "@/lib/schedule";
import { sendWhatsApp, wasSent } from "@/lib/whatsapp";

// El cron debe ejecutar la lógica siempre, nunca servir una respuesta cacheada.
export const dynamic = "force-dynamic";

/** Las columnas `time` de Postgres se comparan como HH:MM:SS */
const timeKey = (d: Date) => `${rdTimeKey(d)}:00`;

export async function GET(request: Request) {
  // Solo el cron entra. Si CRON_SECRET no está configurado cerramos el paso:
  // es preferible que los recordatorios se detengan a dejar la ruta abierta.
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[recordatorios] falta CRON_SECRET en el entorno");
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const nowRd = rdNow();

  // Objetivo: citas que empiezan en exactamente 15 minutos.
  // Se busca entre +14 y +16 para dar 2 minutos de holgura, por si el cron
  // se atrasa o se adelanta. reminder_sent evita el aviso duplicado cuando
  // una misma cita cae dentro de la ventana en varias corridas seguidas.
  const from = new Date(nowRd.getTime() + 14 * 60 * 1000);
  const to = new Date(nowRd.getTime() + 16 * 60 * 1000);

  // La fecha sale de `from`, no de `nowRd`: si la ventana cruza medianoche,
  // buscamos en el día al que pertenecen las citas.
  const today = rdDateKey(from);
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
        `⏰ Hola ${appointment.client_name}, tu cita en *Yoan BarberShop* es en 15 minutos a las *${formatTime(
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

  // Citas de hoy que ya quedaron por debajo de la ventana: empiezan en menos
  // de 15 minutos o ya pasaron. Se marcan como avisadas sin enviar nada, para
  // que el cron no las vuelva a evaluar en cada corrida.
  let skipped = 0;

  const { data: expired, error: expiredError } = await supabase
    .from("appointments")
    .select("id")
    .eq("reminder_sent", false)
    .eq("status", "pending")
    .eq("appointment_date", rdDateKey(nowRd))
    .lt("appointment_time", fromTime);

  if (expiredError) {
    console.error(
      "[recordatorios] no se pudieron leer las citas vencidas:",
      expiredError
    );
  } else if (expired && expired.length > 0) {
    const ids = expired.map((row) => row.id as string);
    const { error: markError } = await supabase
      .from("appointments")
      .update({ reminder_sent: true })
      .in("id", ids);

    if (markError) {
      console.error(
        "[recordatorios] no se pudieron marcar las citas vencidas:",
        markError
      );
    } else {
      skipped = ids.length;
    }
  }

  console.log(
    `[recordatorios] ventana ${today} ${fromTime}–${toTime} · encontradas ${pending.length} · enviadas ${sent} · vencidas marcadas ${skipped}`
  );

  return Response.json({ sent, skipped });
}
