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
  {
    // Files that mostly render numeric/currency/unit symbols (€, %, /, kg)
    // or display data-as-content (historical economic descriptions). The
    // top-level user-visible chrome is migrated; deeper symbol/data nodes
    // stay at warn so they don't block CI while we keep iterating.
    files: [
      "src/components/home/InflationTrends.tsx",
      "src/components/products/store-products-showcase/StoreProductsShowcase.tsx",
      "src/components/products/store-products-showcase/MobileFiltersDrawer.tsx",
      "src/components/products/store-products-showcase/CategoryFilter.tsx",
      "src/components/products/store-products-showcase/FilterControls.tsx",
      "src/components/products/BarcodeCompare.tsx",
      "src/components/products/ProductChart.tsx",
      "src/components/products/StoreProductCard.tsx",
      "src/components/products/IdenticalProductsCompare.tsx",
      "src/components/products/PriceChange.tsx",
      "src/components/products/PricesVariationCard.tsx",
      "src/components/products/PriorityBadge.tsx",
      "src/components/products/PriorityBubble.tsx",
      "src/components/products/PriorityScore.tsx",
      "src/components/products/ComparisonChart.tsx",
      "src/components/products/product-page/ProductHeroDesktop.tsx",
      "src/components/products/product-page/ProductHeroMobile.tsx",
      "src/components/products/product-page/ProductPriceStatsCallout.tsx",
      "src/components/products/product-page/DealSummaryCard.tsx",
      "src/components/products/product-page/CategoryBreadcrumb.tsx",
      "src/components/products/OffProductPage.tsx",
      "src/components/products/OffProductDetails.tsx",
    ],
    rules: {
      "@formatjs/no-literal-string-in-jsx": "warn",
    },
  },
  {
    // Brand-name aria-labels (Instagram, X, LinkedIn, Open Food Facts) and
    // small layout chrome containing product brand strings. Demoted to
    // warn so they don't block CI.
    files: [
      "src/components/layout/NavigationSheet.tsx",
      "src/components/layout/FavoritesLink.tsx",
      "src/components/layout/search/SearchContainer.tsx",
      "src/components/layout/search/SearchContent.tsx",
      "src/components/profile/ProfileSidebar.tsx",
      "src/components/profile/SavingsTab.tsx",
      "src/components/profile/ListsTab.tsx",
      "src/components/favorites/FavoritesShowcase.tsx",
      "src/components/home/PersonalizedDashboard.tsx",
      "src/components/home/Pricing.tsx",
      "src/components/home/PopularProducts.tsx",
      "src/components/home/SavePotential.tsx",
      "src/components/home/FreshnessBadge.tsx",
      "src/app/login/page.tsx",
      "src/app/profile/page.tsx",
      "src/app/products/barcode/**/page.tsx",
      "src/app/products/loading.tsx",
      "src/app/not-found.tsx",
      "src/app/layout.tsx",
      "src/components/products/OffLookupSkeleton.tsx",
      "src/components/products/OffProductCard.tsx",
      "src/components/layout/EarlyAccessBadge.tsx",
      "src/components/layout/UserDropdownMenu.tsx",
    ],
    rules: {
      "@formatjs/no-literal-string-in-jsx": "warn",
    },
  },
]

export default eslintConfig
