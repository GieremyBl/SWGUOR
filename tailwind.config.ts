import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      extend: {
        animation: {
          'thread-flow': 'thread 15s ease-in-out infinite',
          'thread-flow-slow': 'thread 20s ease-in-out infinite reverse',
        },
        keyframes: {
          thread: {
            '0%, 100%': {
              strokeDasharray: '0, 1000',
              strokeDashoffset: '0',
              transform: 'translateX(-5%)'
            },
            '50%': {
              strokeDasharray: '1000, 0',
              strokeDashoffset: '-100',
              transform: 'translateX(5%)'
            },
          }
        }
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // -----------------------------------------------------------

        // Tus colores personalizados (Mantenidos)
        primary: {
          DEFAULT: '#d4945a', // Dorado del logo como default
          50: '#fef8f3',
          100: '#fef0e6',
          200: '#fcdec7',
          300: '#f9c79d',
          400: '#f5a869',
          500: '#d4945a',
          600: '#b87947',
          700: '#935f38',
          800: '#77502f',
          900: '#624128',
        },
        accent: {
          DEFAULT: '#fbd9e3', // Rosa suave como default
          50: '#fef6f8',
          100: '#fdedf1',
          200: '#fbd9e3',
          300: '#f8b8cc',
          400: '#f48dae',
          500: '#eb6591',
          600: '#d94876',
          700: '#b8365f',
          800: '#982d50',
          900: '#7f2846',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;