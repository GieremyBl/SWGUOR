import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/config/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'great-vibes': ['var(--font-great-vibes)', 'cursive'],
      },
      animation: {
        "thread-flow": "thread 15s ease-in-out infinite",
        "thread-flow-slow": "thread 20s ease-in-out infinite reverse",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        thread: {
          "0%, 100%": { strokeDasharray: "0, 1000", strokeDashoffset: "0", transform: "translateX(-5%)" },
          "50%": { strokeDasharray: "1000, 0", strokeDashoffset: "-100", transform: "translateX(5%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },

        guor: {
          // ── Escala numérica completa ──────────────────────────────
          50: "#fdf9f3",   // crema más claro (fondo página)
          100: "#f5efe4",   // crema profundo
          200: "#ede8e0",   // piedra claro
          300: "#d8d0c4",   // piedra medio
          400: "#b0a090",   // gris cálido
          500: "#8a6d3b",   // marrón cálido (links, texto muted enfatizado)
          600: "#c4a35a",   // gold champagne (acento principal)
          700: "#a8832e",   // gold oscuro (hover del acento)
          800: "#3d3022",   // dark medio
          900: "#1a1410",   // dark base (texto primario)

          // ── Aliases semánticos ────────────────────────────────────
          ink: "#1a1410",  // texto primario
          soft: "#8a6d3b",  // texto secundario / muted
          muted: "#b0a090",  // texto hint / placeholder
          line: "#e8d5a8",  // bordes
          "line-soft": "#ede8e0",  // bordes muy sutiles
          bg: "#fdf9f3",  // fondo página
          surface: "#ffffff",  // fondo cards
          hover: "#f5efe4",  // hover rows / items

          // ── Tokens de marca ───────────────────────────────────────
          dark: "#1a1410",
          "dark-80": "#2c2218",
          "dark-60": "#3d3022",
          gold: "#c4a35a",
          "gold-warm": "#d4b472",
          "gold-pale": "#e8d5a8",
          "gold-dust": "#f4ecda",
          cream: "#fdf9f3",
          "cream-deep": "#f5efe4",
          stone: "#ede8e0",
          "stone-mid": "#d8d0c4",
          white: "#ffffff",
        },

        status: {
          success: "#16a34a",
          warning: "#d97706",
          danger: "#dc2626",
          info: "#0369a1",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 4px 0 rgb(26 20 16 / 0.06), 0 1px 2px -1px rgb(26 20 16 / 0.04)",
        "card-md": "0 6px 24px -6px rgb(26 20 16 / 0.10), 0 2px 6px -2px rgb(26 20 16 / 0.06)",
        "card-hover": "0 8px 32px -6px rgb(26 20 16 / 0.14), 0 3px 8px -2px rgb(26 20 16 / 0.08)",
        modal: "0 24px 64px -12px rgb(26 20 16 / 0.22)",
        subtle: "0 1px 0 0 hsl(var(--border))",
        gold: "0 4px 20px -4px rgb(196 163 90 / 0.30)",
        "gold-lg": "0 8px 32px -8px rgb(196 163 90 / 0.40)",
        "inset-gold": "inset 3px 0 0 #c4a35a",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "erp-wash": "linear-gradient(135deg, #fdf9f3 0%, #f5efe4 100%)",
        "dark-wash": "linear-gradient(135deg, #1a1410 0%, #2c2218 100%)",
        "gold-wash": "linear-gradient(135deg, #c4a35a 0%, #d4b472 100%)",
        "stone-wash": "linear-gradient(135deg, #f5efe4 0%, #ede8e0 100%)",
        "kpi-hover": "linear-gradient(135deg, #ffffff 0%, #fdf9f3 100%)",
      },
    },
  },
  plugins: [],
};

export default config;