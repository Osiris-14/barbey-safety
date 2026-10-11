"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Logo from "./Logo";

const LINKS = [
  { href: "#funciones", label: "Funciones" },
  { href: "#demo", label: "Pruébalo" },
  { href: "#para-quien", label: "Para quién" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#preguntas", label: "Preguntas" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`nav ${scrolled || open ? "scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="nav-actions">
          <a className="nav-login" href="/admin/login">Iniciar sesión</a>
          <a className="btn btn-primary" href="#empezar">
            Solicitar acceso <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      <nav id="menu-movil" className={`mobile-menu ${open ? "open" : ""}`} aria-label="Menú móvil">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href="/admin/login" onClick={() => setOpen(false)}>Iniciar sesión</a>
        <a className="btn btn-primary" href="#empezar" onClick={() => setOpen(false)}>
          Solicitar acceso <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
