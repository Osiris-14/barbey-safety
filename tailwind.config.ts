import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#111111",
        primary: "#C9A84C",
        content: "#F0F0F0",
        surface: "#1C1C1C",
        "surface-2": "#252525",
        edge: "#2E2E2E",
      },
    },
  },
  plugins: [],
};

export default config;
