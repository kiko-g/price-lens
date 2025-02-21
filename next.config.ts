import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
