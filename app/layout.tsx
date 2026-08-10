import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yoan BarberShop",
  description: "Agenda tu cita en Yoan BarberShop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-night text-content antialiased">
        {children}
      </body>
    </html>
  );
}
