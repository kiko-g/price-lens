import { Suspense } from "react"
import type { Metadata } from "next"
import { pageMetadataFromKey } from "@/lib/config"

import { Layout } from "@/components/layout"
import { DealsShowcase } from "@/components/deals/DealsShowcase"
import DealsLoading from "@/app/deals/loading"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("deals")
}

export default function DealsPage() {
  return (
    <Layout>
      <main className="flex w-full flex-col items-center justify-center">
        <Suspense fallback={<DealsLoading />}>
          <DealsShowcase />
        </Suspense>
      </main>
    </Layout>
  )
}
