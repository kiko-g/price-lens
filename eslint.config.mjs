import nextConfig from "eslint-config-next"
import formatjs from "eslint-plugin-formatjs"

const eslintConfig = [
  ...nextConfig,
  { ignores: ["public/**"] },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: { "@formatjs": formatjs },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off", // TODO: FIXME:
      "prefer-const": "error",
      "react/no-unescaped-entities": "warn",

      // Catch empty catch blocks — silent failures are worse than visible ones
      "no-empty": ["error", { allowEmptyCatch: false }],

      // Catch components defined inside render (performance + hook rules violation risk)
      "react/no-unstable-nested-components": "warn",

      // React hooks - keep rules-of-hooks as error, rest as warnings
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Flag raw JSX string literals in user-facing code.
      // Promoted to "error" after the bulk migration. Files that primarily
      // render symbols (€, %, /, kg) or wall-of-text data (e.g. inflation
      // historical entries) are downgraded individually below.
      "@formatjs/no-literal-string-in-jsx": "error",

      // Disable React Compiler rules (not using React Compiler)
      "react-hooks/config": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/component-hook-factories": "off",
      "react-hooks/gating": "off",
      "react-hooks/globals": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/static-components": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    // Admin area, scrapers, and API routes are explicitly out of scope for
    // i18n migration; keep the JSX-literal rule off there so it doesn't
    // create noise.
    files: [
      "src/app/admin/**/*.{ts,tsx}",
      "src/components/admin/**/*.{ts,tsx}",
      "src/lib/scrapers/**/*.{ts,tsx}",
      "src/app/api/**/*.{ts,tsx}",
      "src/lib/pipeline/**/*.{ts,tsx}",
      "scripts/**/*.{ts,tsx}",
    ],
    rules: {
      "@formatjs/no-literal-string-in-jsx": "off",
    },
  },
  {
    // OpenGraph image routes render JSX inside Edge runtime via @vercel/og;
    // they ship as raster images, not user-readable HTML, and cannot use
    // useTranslations. Treat them as out-of-scope.
    files: ["src/app/**/og/route.tsx", "src/app/**/og/route.ts", "src/lib/og-layout.tsx"],
    rules: {
      "@formatjs/no-literal-string-in-jsx": "off",
    },
  },
  {
    // shadcn/ui primitives carry sr-only fallback labels (e.g. "Close",
    // "Toggle Sidebar") that consumers normally override or are accessibility
    // backstops. Leave them as warnings rather than blocking CI.
    files: [
      "src/components/ui/*.tsx",
      "src/components/ui/combo/back-button.tsx",
      "src/components/ui/combo/barcode.tsx",
      "src/components/ui/combo/dev-badge.tsx",
      "src/components/ui/combo/nutri-score.tsx",
      "src/components/ui/combo/state-views.tsx",
    ],
    rules: {
      "@formatjs/no-literal-string-in-jsx": "warn",
    },
  },
  {
    // Brand/icon SVG components render trademark text and are intentionally
    // not localized.
    files: ["src/components/icons/*.tsx", "src/components/logos/*.tsx"],
    rules: {
      "@formatjs/no-literal-string-in-jsx": "off",
    },
  },
]

export default eslintConfig
