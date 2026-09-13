import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "425px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // ===== PALETTE UFFICIALE (allineata a index.html L27-L42) =====
        "bg-main": "#f9f5ec",
        "bg-card": "#fffdf9",
        "bg-alt": "#ede1ca",
        "bg-warm": "#e4d5bb",
        "bg-dark": "#241a12",
        "bg-darker": "#18100a",

        // Crema / Pietra
        stone: "#dec5a5",
        "stone-dark": "#a07f55",

        // Terracotta — cremisi logo
        terracotta: "#93161a",
        "terracotta-dark": "#4d1a10",
        "terracotta-light": "#f0d8d9",

        // Bronzo antico — dorato (mantenuto per cordicelle/logo)
        gold: "#a87e3c",
        "gold-dark": "#7a5828",
        "gold-light": "#f8eed9",

        // Oliva — marrone chiaro (nuova palette, ex verde foresta)
        olive: "#936f52",
        "olive-dark": "#482e21",
        "olive-light": "#ece1d3",

        // Verde foresta Slow Tourism (riservato: banner ed etichette slow)
        forest: "#5d7250",
        "forest-dark": "#3e4d34",
        "forest-light": "#e8ede3",

        // Blu Adriatico
        "blue-adriatic": "#537385",
        "blue-dark": "#47596a",

        "text-main": "#2b2018",
        "text-muted": "#72553f",
        "text-light": "#b18e6d",
        "text-white": "#f7f0e3",
      },
      
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        "2xs": "0 1px 4px rgba(43, 32, 24, 0.04)",
        sm: "0 2px 8px rgba(43, 32, 24, 0.05)",
        md: "0 8px 24px rgba(43, 32, 24, 0.09)",
        lg: "0 16px 40px rgba(43, 32, 24, 0.13)",
        glow: "0 0 25px rgba(168, 126, 60, 0.28)",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        pill: "100px",
      },
      maxWidth: {
        content: "1240px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.8s ease-out both",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
