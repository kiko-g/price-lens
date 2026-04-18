import type { Metadata } from "next"
import { pageMetadataFromKey } from "@/lib/config"
import { Layout } from "@/components/layout"
import { AppInstallContent } from "@/components/pwa/AppInstallContent"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("app")
}

export default function AppPage() {
  return (
    <Layout>
      <AppInstallContent />
    </Layout>
  )
}
