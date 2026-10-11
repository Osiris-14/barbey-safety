"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

/** Botón fijo en móvil: aparece tras el hero y se oculta al llegar al formulario. */
export default function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const form = document.getElementById("empezar");
    const update = () => {
      const pastHero = window.scrollY > 520;
      const rect = form?.getBoundingClientRect();
      const formVisible = rect ? rect.top < window.innerHeight * 0.85 : false;
      setShow(pastHero && !formVisible);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className={`sticky-cta ${show ? "show" : ""}`} aria-hidden={!show}>
      <a className="btn btn-primary" href="#empezar" tabIndex={show ? 0 : -1}>
        Solicitar acceso <ArrowUpRight size={18} aria-hidden="true" />
      </a>
    </div>
  );
}
