import pluginJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintImport from "eslint-plugin-import";
import pluginPrettier from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default [
  // Global
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    ignores: ["node_modules/", "dist/", ".wrangler/", "**/*.d.ts", "public/**"],
  },
  /** Prettier */
  pluginPrettier,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  /**
   * ESLint Typescript recommended
   * @see
   */
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    files: ["**/*.{js, jsx, ts, tsx}"],
    plugins: {
      import: eslintImport,
    },
  },
];
