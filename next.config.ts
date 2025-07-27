// import ReactComponentName from "react-scan/react-component-name/webpack"
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
    ],
  },
  // webpack: (config) => {
  //   config.plugins.push(ReactComponentName({}))
  //   return config
  // },
}

export default nextConfig
