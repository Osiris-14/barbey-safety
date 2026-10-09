"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ban,
  CalendarCheck,
  List,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-auth";
import PushSubscribe from "@/components/PushSubscribe";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setCollapsed(
      window.localStorage.getItem("barbey-safety:sidebar-collapsed") === "true"
    );
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("barbey-safety:sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabaseAuth.auth.signOut();
    if (error) console.error("[logout] no se pudo cerrar sesión:", error);
    router.replace("/admin/login");
    router.refresh();
  };

  const signOutButton = (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-edge px-3 text-xs text-content/50 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
    >
      <LogOut className="h-3.5 w-3.5" />
      {signingOut ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );

  // El login vive en /admin/login pero no debe heredar el sidebar
  if (pathname === "/admin/login") return <>{children}</>;

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
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-edge bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpeg"
          alt="Yoan BarberShop"
          style={{ width: 40, height: 40, objectFit: "contain" }}
        />
      </span>
      <span className="font-semibold tracking-tight">Yoan BarberShop</span>
    </Link>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar fijo — tablet (220px) y escritorio (240px) */}
      <aside
        className={`fixed inset-y-0 left-0 hidden flex-col border-r border-edge bg-surface p-5 transition-[width] duration-200 md:flex ${
          collapsed ? "w-[72px]" : "w-[220px] lg:w-[240px]"
        }`}
      >
        <div
          className={`mb-8 flex ${
            collapsed
              ? "flex-col items-center gap-2"
              : "items-center justify-between"
          }`}
        >
          {collapsed ? (
            <Link href="/admin" aria-label="Ir al inicio">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-edge bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpeg" alt="Yoan BarberShop" className="h-10 w-10 object-contain" />
              </span>
            </Link>
          ) : (
            brand
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge text-content/50 transition hover:border-primary/40 hover:text-primary"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {nav}
        <div className="mt-auto space-y-2">
          {!collapsed && <PushSubscribe />}
          <Link
            href="/"
            aria-label="Ver página del cliente"
            className={`block rounded-xl border border-edge px-3 py-2.5 text-center text-xs text-content/50 transition hover:border-primary/40 hover:text-primary ${collapsed ? "h-10 w-10 p-0 leading-10" : ""}`}
          >
            {collapsed ? "↗" : "Ver página del cliente"}
          </Link>
          {collapsed ? (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge text-content/50 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            signOutButton
          )}
        </div>
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
          <div className="mt-6 space-y-2">
            <PushSubscribe />
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="block rounded-xl border border-edge px-3 py-2.5 text-center text-xs text-content/50 transition hover:border-primary/40 hover:text-primary"
            >
              Ver página del cliente
            </Link>
            {signOutButton}
          </div>
        </div>
      </div>

      <main
        className={`flex-1 p-4 transition-[margin] duration-200 sm:p-6 lg:p-8 ${
          collapsed ? "md:ml-[72px]" : "md:ml-[220px] lg:ml-[240px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
