// import ReactComponentName from "react-scan/react-component-name/webpack"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  compiler: {
    // Only remove console.debug and console.trace in production
    // Keep console.log, console.warn, console.error, console.info for observability
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["log", "warn", "error", "info"],
          }
        : false,
  },
  images: {
    // Limit device sizes to reduce number of image transformations
    // Default is [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    deviceSizes: [640, 828, 1200, 1920],
    // Limit image sizes to reduce transformations further
    // Default is [16, 32, 48, 64, 96, 128, 256, 384]
    imageSizes: [96, 256, 384],
    // Cache optimized images for 60 days to reduce repeated transformations
    minimumCacheTTL: 60 * 60 * 24 * 60, // 60 days in seconds
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.continente.pt",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.zu.pt",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wells.pt",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.auchan.pt",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.pingodoce.pt",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // webpack: (config) => {
  //   config.plugins.push(ReactComponentName({}))
  //   return config
  // },
}

export default withNextIntl(nextConfig)
