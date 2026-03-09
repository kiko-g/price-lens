import type { Metadata } from "next"
import { pageMetadata } from "@/lib/config"

export const metadata: Metadata = pageMetadata(
  "Profile",
  "Manage your Price Lens account, preferences, and subscription.",
)

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
