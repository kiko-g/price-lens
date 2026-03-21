import type { Metadata } from "next"
import { pageMetadata } from "@/lib/config"
import { Layout } from "@/components/layout"
import { AppInstallContent } from "@/components/pwa/AppInstallContent"

export const metadata: Metadata = pageMetadata(
  "Get the App",
  "Install Price Lens as a free app on your phone for a faster, offline-ready, full-screen experience.",
)

export default function AppPage() {
  return (
    <Layout>
      <AppInstallContent />
    </Layout>
  )
}
