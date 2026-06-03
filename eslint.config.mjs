import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ── Relax `any` en capas de infraestructura ──────────────────────────────
  {
    files: [
      "src/lib/helpers/**",
      "src/lib/services/**",
      "src/lib/hooks/**",
      "src/lib/schemas/**",
      "src/lib/logic/**",
      "src/lib/auth/**",
      "src/lib/utils/export-utils.tsx",
      "src/lib/utils/serialize.ts",
      "src/lib/prisma.ts",
      "src/lib/with-auth.ts",
      "src/lib/constants/estados.ts",
      "src/proxy.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
    },
  },

  // ── Reglas globales menos estrictas para facilitar migración progresiva ──
  {
    files: ["**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },

  // ── Relax warnings menores en archivos de portal ─────────────────────────
  {
    files: ["src/components/portal/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
