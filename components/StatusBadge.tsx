import type { AppointmentStatus } from "@/lib/supabase";

const STYLES: Record<AppointmentStatus, { label: string; className: string }> = {
  confirmed: {
    label: "Asistió",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  no_show: {
    label: "No asistió",
    className: "border-red-500/40 bg-red-500/10 text-red-400",
  },
  pending: {
    label: "Pendiente",
    className: "border-edge bg-surface-2 text-content/60",
  },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
