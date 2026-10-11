"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Retraso en ms para escalonar elementos hermanos */
  delay?: number;
  /** Añade el brillo que sigue al cursor (tarjetas del bento) */
  spotlight?: boolean;
};

/** Aparece suave cuando entra en pantalla. Sin JS el contenido se ve igual (ver <noscript> en page.tsx). */
export default function Reveal({ children, className = "", delay = 0, spotlight = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = spotlight
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }
    : undefined;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`reveal ${visible ? "in" : ""} ${className}`}
      style={{ "--d": delay } as CSSProperties}
    >
      {children}
    </div>
  );
}
