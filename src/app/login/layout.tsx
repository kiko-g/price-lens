import type { Metadata } from "next"
import { pageMetadataFromKey } from "@/lib/config"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("login")
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
