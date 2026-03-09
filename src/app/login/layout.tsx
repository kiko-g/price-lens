import type { Metadata } from "next"
import { pageMetadata } from "@/lib/config"

export const metadata: Metadata = pageMetadata(
  "Login",
  "Sign in to Price Lens to track prices, save favorites, and get alerts on Portuguese supermarket products.",
)

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
