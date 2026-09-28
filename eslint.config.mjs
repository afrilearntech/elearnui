import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const nextConfig = [...nextVitals, ...nextTs].map((config) => {
  const rules = { ...config.rules };
  if ("react-hooks/immutability" in rules) rules["react-hooks/immutability"] = "warn";
  if ("react-hooks/preserve-manual-memoization" in rules) {
    rules["react-hooks/preserve-manual-memoization"] = "warn";
  }
  if ("react-hooks/purity" in rules) rules["react-hooks/purity"] = "warn";
  if ("react-hooks/set-state-in-effect" in rules) rules["react-hooks/set-state-in-effect"] = "warn";
  return { ...config, rules };
});

const eslintConfig = defineConfig([
  ...nextConfig,
  {
    rules: {
      // Custom rules for e-learning platform
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "*.config.js",
    "*.config.mjs",
  ]),
]);

export default eslintConfig;
