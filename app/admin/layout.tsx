"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ban,
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  List,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-auth";
import PushSubscribe from "@/components/PushSubscribe";
import { MenuContext } from "./_components/admin-ui";
import { adminFonts } from "./fonts";
import "./admin.css";

const COLLAPSED_KEY = "barbey-safety:sidebar-collapsed";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin", label: "Inicio", icon: CalendarDays },
  { href: "/admin/appointments", label: "Todas las citas", icon: List },
  { href: "/admin/blocked", label: "Bloquear horarios", icon: Ban },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // Solo en escritorio/tablet: en móvil el menú es un drawer
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "true");
    } catch {
      // Navegadores que bloquean el almacenamiento: arranca expandido
    }
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {
      // Sin almacenamiento solo se pierde la preferencia
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabaseAuth.auth.signOut();
    if (error) console.error("[logout] no se pudo cerrar sesión:", error);
    router.replace("/admin/login");
    router.refresh();
  };

  // El login vive en /admin/login pero no debe heredar el sidebar
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <MenuContext.Provider value={setOpen}>
      <div className={`admin-app app-shell ${adminFonts} ${
          collapsed ? "sidebar-collapsed" : ""
        }`}>
        {open && <div className="scrim" onClick={() => setOpen(false)} />}
        <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
          <div className="brand">
            <span className="logo has-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="Yoan BarberShop" />
            </span>
            <div>
              <strong>Yoan</strong>
              <span>BarberShop</span>
            </div>
            <button
              className="icon-button sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
              title={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} strokeWidth={1.8} />
              ) : (
                <PanelLeftClose size={18} strokeWidth={1.8} />
              )}
            </button>
            <button
              className="icon-button sidebar-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>

          <nav>
            <p className="nav-label">GESTIÓN</p>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={pathname === href ? "nav-item active" : "nav-item"}
                title={collapsed ? label : undefined}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="push-slot">
              <PushSubscribe />
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="secondary-button full"
              title="Ver página del cliente"
            >
              <ExternalLink size={17} strokeWidth={1.8} />
              <span>Ver página del cliente</span>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="ghost-button full"
              title="Cerrar sesión"
            >
              <LogOut size={17} strokeWidth={1.8} />
              <span>{signingOut ? "Saliendo…" : "Cerrar sesión"}</span>
            </button>
          </div>
        </aside>

        <div className="content-shell">
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </MenuContext.Provider>
  );
}
