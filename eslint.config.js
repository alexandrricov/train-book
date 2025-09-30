import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react/no-unknown-property": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
]);
