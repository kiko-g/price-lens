import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { WifiOffIcon } from "lucide-react"

import { pageMetadataFromKey } from "@/lib/config"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("offline")
}

export default async function OfflinePage() {
  const t = await getTranslations("errors.offline")
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOffIcon className="text-muted-foreground h-16 w-16" />
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-sm">{t("body")}</p>
    </main>
  )
}
