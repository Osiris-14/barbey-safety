import { DM_Sans, Manrope } from "next/font/google";

// Tipografías de la landing: las mismas familias del panel, para que
// la marca se sienta continua entre la web pública y la app.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lp-body",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-lp-head",
  display: "swap",
});

export const landingFonts = `${dmSans.variable} ${manrope.variable}`;
