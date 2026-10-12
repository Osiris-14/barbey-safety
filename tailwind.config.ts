import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Sistema Apple primero; cae a la pila por defecto en otras plataformas.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "ui-sans-serif",
          "system-ui",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        night: "#f5f7f6",
        primary: "#326b5b",
        content: "#24332d",
        surface: "#ffffff",
        "surface-2": "#eef2f0",
        edge: "#e1e8e4",
      },
      boxShadow: {
        // Sombras suaves contextuales estilo Apple para el tema claro.
        apple: "0 1px 2px rgba(31,52,43,0.06), 0 8px 24px rgba(31,52,43,0.08)",
        "apple-lg":
          "0 2px 6px rgba(31,52,43,0.08), 0 18px 48px rgba(31,52,43,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
