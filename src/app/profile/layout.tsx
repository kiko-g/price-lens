import type { Metadata } from "next"
import { pageMetadataFromKey } from "@/lib/config"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("profile")
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
