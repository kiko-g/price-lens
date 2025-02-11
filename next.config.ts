import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.continente.pt",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
