"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ban, CalendarCheck, List, Menu, Scissors, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Inicio", icon: CalendarCheck },
  { href: "/admin/appointments", label: "Todas las citas", icon: List },
  { href: "/admin/blocked", label: "Bloquear horas", icon: Ban },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={[
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm transition",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-content/60 hover:bg-surface-2 hover:text-content",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-surface-2">
        <Scissors className="h-4 w-4 text-primary" />
      </span>
      <span className="font-semibold tracking-tight">Yoan BarberShop</span>
    </Link>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar fijo — tablet (220px) y escritorio (240px) */}
      <aside className="fixed inset-y-0 left-0 hidden w-[220px] flex-col border-r border-edge bg-surface p-5 md:flex lg:w-[240px]">
        <div className="mb-8">{brand}</div>
        {nav}
        <Link
          href="/"
          className="mt-auto rounded-xl border border-edge px-3 py-2.5 text-center text-xs text-content/50 transition hover:border-primary/40 hover:text-primary"
        >
          Ver página del cliente
        </Link>
      </aside>

      {/* Barra superior — móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-edge bg-surface px-4 py-3 md:hidden">
        {brand}
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-edge text-content/70 transition hover:text-primary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer deslizante — móvil */}
      <div
        className={[
          "fixed inset-0 z-40 md:hidden",
          open ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={[
            "absolute inset-0 bg-black/60 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          className={[
            "absolute inset-y-0 left-0 w-[min(280px,80vw)] border-r border-edge bg-surface p-5 shadow-xl transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="mb-8 flex items-center justify-between">
            {brand}
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-content/60 transition hover:text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {nav}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mt-6 block rounded-xl border border-edge px-3 py-2.5 text-center text-xs text-content/50 transition hover:border-primary/40 hover:text-primary"
          >
            Ver página del cliente
          </Link>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 md:ml-[220px] lg:ml-[240px] lg:p-8">
        {children}
      </main>
    </div>
  );
}
