import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  { ignores: ["public/**"] },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
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
]

export default eslintConfig
