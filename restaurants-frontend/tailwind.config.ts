import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── Paleta de marca ──────────────────────────────────────
        // Primario "Brasa" (terracota cálido). Reemplaza la escala
        // `orange` por defecto de Tailwind, así todos los `*-orange-*`
        // existentes adoptan la nueva marca. El tono por MODO (claro vs
        // oscuro) se ajusta con overrides en globals.css.
        orange: {
          50: "#FFF1E7",
          100: "#FFE3D1",
          200: "#FBC9A6",
          300: "#F6A472",
          400: "#F07B3E",
          500: "#E8590C",
          600: "#C2410C",
          700: "#9A3412",
          800: "#7C2D12",
          900: "#67230F",
          950: "#3E1408",
        },
        // Neutros CÁLIDOS (stone) en vez de grises fríos azulados.
        // Reemplaza la escala `gray` por defecto.
        gray: {
          50: "#FAF8F5",
          100: "#F4F0EA",
          200: "#E7E1D8",
          300: "#D6CEC4",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0F0D0B",
        },
        // Acento "Selva" (verde amazónico, eco / éxito).
        selva: {
          50: "#E6F4EE",
          100: "#C7E7DA",
          200: "#92CFB4",
          300: "#5DB58E",
          400: "#2F9C6E",
          500: "#157F5B",
          600: "#106848",
          700: "#0D513A",
          800: "#0A3E2D",
          900: "#082F22",
        },
        brand: {
          50: "#FFF1E7",
          100: "#FFE3D1",
          200: "#FBC9A6",
          300: "#F6A472",
          400: "#F07B3E",
          500: "#E8590C",
          600: "#C2410C",
          700: "#9A3412",
          800: "#7C2D12",
          900: "#67230F",
          950: "#3E1408",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-left": {
          from: { opacity: "0", transform: "translateX(-50px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(50px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Aparición con "rebote" para selecciones / badges
        pop: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "60%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        // Entrada suave para cards (más corta que slide-up, para listas escalonadas)
        "pop-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "slide-up": "slide-up 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-left": "slide-left 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-right": "slide-right 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        pop: "pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pop-in": "pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
