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
        night: "#f5f7f6",
        primary: "#326b5b",
        content: "#24332d",
        surface: "#ffffff",
        "surface-2": "#eef2f0",
        edge: "#e1e8e4",
      },
    },
  },
  plugins: [],
};

export default config;
