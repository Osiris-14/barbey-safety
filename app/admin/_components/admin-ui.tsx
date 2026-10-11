"use client";

import { createContext, useContext } from "react";
import { Menu } from "lucide-react";
import type { AppointmentStatus } from "@/lib/supabase";
// Bajo RLS el panel debe actuar como `authenticated`. Sin alias, a propósito:
// leerlo como `supabase` hace pensar que es el cliente anónimo.
import { supabaseAuth } from "@/lib/supabase-auth";
import { rdDateKey, rdNow } from "@/lib/schedule";

/** El layout guarda si el menú móvil está abierto; las páginas solo lo abren */
export const MenuContext = createContext<(open: boolean) => void>(() => {});

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Asistió",
  no_show: "No asistió",
  cancelled: "Cancelada",
};

export const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "no_show",
  "cancelled",
];

export function PageHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow: string;
  action?: React.ReactNode;
}) {
  const setOpen = useContext(MenuContext);
  return (
    <header className="page-header">
      <button
        className="icon-button mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`pill pill-${status}`}>
      <span />
      {STATUS_LABEL[status] ?? STATUS_LABEL.pending}
    </span>
  );
}

/** "John Medina" → "JM" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

/**
 * Cambia el estado de una cita. Devuelve el mensaje de error para mostrar,
 * o null si se guardó.
 *
 * .select() es lo que delata un rechazo silencioso: si una política de RLS
 * filtra la fila, el UPDATE afecta 0 filas y Postgres no devuelve error.
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<string | null> {
  const { data, error } = await supabaseAuth
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    console.error("[citas] no se pudo actualizar el estado:", error, {
      id,
      status,
    });
    return `No pudimos actualizar el estado. ${error.message}${
      error.code ? ` (${error.code})` : ""
    }`;
  }
  if (!data || data.length === 0) {
    console.error("[citas] el UPDATE no afectó ninguna fila:", { id, status });
    return "El cambio no se guardó: la base rechazó la fila. Cierra sesión y vuelve a entrar.";
  }
  return null;
}

/** Hoy en República Dominicana (YYYY-MM-DD), sin importar el huso del dispositivo */
export function rdTodayKey(): string {
  return rdDateKey(rdNow());
}

/** "lunes, 12 de octubre" → "Lunes, 12 de octubre" */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
