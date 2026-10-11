import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        // ===== PALETTE DINAMICA (gestita da CSS variables con supporto Dark Mode & Opacity) =====
        "bg-main": "rgb(var(--bg-main-rgb, 249 245 236) / <alpha-value>)",
        "bg-card": "rgb(var(--bg-card-rgb, 255 253 249) / <alpha-value>)",
        "bg-alt": "rgb(var(--bg-alt-rgb, 237 225 202) / <alpha-value>)",
        "bg-warm": "rgb(var(--bg-warm-rgb, 228 213 187) / <alpha-value>)",
        "bg-dark": "rgb(var(--bg-dark-rgb, 36 26 18) / <alpha-value>)",
        "bg-darker": "rgb(var(--bg-darker-rgb, 24 16 10) / <alpha-value>)",

        // Crema / Pietra
        stone: "rgb(var(--color-stone-rgb, 222 197 165) / <alpha-value>)",
        "stone-dark": "rgb(var(--color-stone-dark-rgb, 160 127 85) / <alpha-value>)",

        // Terracotta — cremisi logo
        terracotta: "rgb(var(--color-terracotta-rgb, 147 22 26) / <alpha-value>)",
        "terracotta-dark": "rgb(var(--color-terracotta-dark-rgb, 77 26 16) / <alpha-value>)",
        "terracotta-light": "rgb(var(--color-terracotta-light-rgb, 240 216 217) / <alpha-value>)",

        // Bronzo antico — dorato
        gold: "rgb(var(--color-gold-rgb, 168 126 60) / <alpha-value>)",
        "gold-dark": "rgb(var(--color-gold-dark-rgb, 122 88 40) / <alpha-value>)",
        "gold-light": "rgb(var(--color-gold-light-rgb, 248 238 217) / <alpha-value>)",

        // Oliva — marrone chiaro
        olive: "rgb(var(--color-olive-rgb, 147 111 82) / <alpha-value>)",
        "olive-dark": "rgb(var(--color-olive-dark-rgb, 72 46 33) / <alpha-value>)",
        "olive-light": "rgb(var(--color-olive-light-rgb, 236 225 211) / <alpha-value>)",

        // Verde foresta Slow Tourism
        forest: "rgb(var(--color-forest-rgb, 93 114 80) / <alpha-value>)",
        "forest-dark": "rgb(var(--color-forest-dark-rgb, 62 77 52) / <alpha-value>)",
        "forest-light": "rgb(var(--color-forest-light-rgb, 232 237 227) / <alpha-value>)",

        // Blu Adriatico
        "blue-adriatic": "rgb(var(--color-blue-adriatic-rgb, 83 115 133) / <alpha-value>)",
        "blue-dark": "rgb(var(--color-blue-dark-rgb, 71 89 106) / <alpha-value>)",

        // Testi
        "text-main": "rgb(var(--text-main-rgb, 43 32 24) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted-rgb, 114 85 63) / <alpha-value>)",
        "text-light": "rgb(var(--text-light-rgb, 177 142 109) / <alpha-value>)",
        "text-white": "var(--text-white, #f7f0e3)",

        // Specifici dark mode per sfondi caldi
        "dark-surface": "#1d1712",
        "dark-surface-elevated": "#261f18",
        "dark-border": "#3d3024",
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
