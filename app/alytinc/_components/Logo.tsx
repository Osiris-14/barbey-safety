import { CalendarCheck } from "lucide-react";

export default function Logo({ href = "#inicio" }: { href?: string }) {
  return (
    <a href={href} className="brand" aria-label="Alytinc, ir al inicio">
      <span className="brand-mark" aria-hidden="true">
        <CalendarCheck size={22} strokeWidth={2.2} />
      </span>
      Alytinc
    </a>
  );
}
