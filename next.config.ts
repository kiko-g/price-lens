import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
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
    ],
  },
}

export default nextConfig
