/**
 * Turnos de 45 minutos, de 9:30 AM a 11:45 PM.
 * Van con cero a la izquierda ("09:30", no "9:30") porque Postgres devuelve
 * las columnas `time` como "09:30:00" y comparamos estas cadenas directamente.
 */
export const TIME_SLOTS = [
  "09:30",
  "10:15",
  "11:00",
  "11:45",
  "12:30",
  "13:15",
  "14:00",
  "14:45",
  "15:30",
  "16:15",
  "17:00",
  "17:45",
  "18:30",
  "19:15",
  "20:00",
  "20:45",
  "21:30",
  "22:15",
  "23:00",
  "23:45",
] as const;

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Lunes → Domingo, para el encabezado del calendario */
export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/** República Dominicana: UTC-4 todo el año, sin horario de verano */
export const RD_OFFSET_MS = 4 * 60 * 60 * 1000;

/**
 * "Ahora" en hora dominicana, como instante desplazado: sobre el Date que
 * devuelve hay que usar los getters UTC para leer la hora de pared de RD.
 * Es la referencia única para recordatorios y para ocultar horas pasadas.
 */
export function rdNow(): Date {
  return new Date(Date.now() - RD_OFFSET_MS);
}

/** YYYY-MM-DD de un instante ya desplazado a RD */
export function rdDateKey(shifted: Date): string {
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** HH:MM de un instante ya desplazado a RD */
export function rdTimeKey(shifted: Date): string {
  const h = String(shifted.getUTCHours()).padStart(2, "0");
  const m = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Minutos que faltan para una cita, en hora RD.
 * Negativo si la cita ya pasó.
 */
export function minutesUntil(dateKey: string, time: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = normalizeTime(time).split(":").map(Number);
  // Ambos lados quedan codificados como "hora de pared RD sobre UTC"
  const appointmentMs = Date.UTC(y, m - 1, d, hh, mm);
  return (appointmentMs - rdNow().getTime()) / 60000;
}

/**
 * Fecha local en formato YYYY-MM-DD.
 * Evitamos toISOString() porque convierte a UTC y puede correr el día.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "09:30:00" | "09:30" → "09:30" */
export function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

/** "14:30:00" → "2:30 PM" */
export function formatTime(time: string): string {
  const [hStr, m] = normalizeTime(time).split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

/** "2026-08-10" → "lunes, 10 de agosto de 2026" */
export function formatLongDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "2026-08-10" → "10 ago 2026" */
export function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Matriz de semanas (lunes primero); null = celda vacía */
export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=domingo → lo convertimos a 0=lunes
  const leading = (first.getDay() + 6) % 7;

  const cells: (Date | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
