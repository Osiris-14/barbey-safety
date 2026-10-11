import { DM_Sans, Manrope } from "next/font/google";

// Tipografías del rediseño del panel. Se exponen como variables CSS que
// admin.css usa dentro de .admin-app.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
});

export const adminFonts = `${dmSans.variable} ${manrope.variable}`;
