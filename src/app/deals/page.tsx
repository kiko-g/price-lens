import { Suspense } from "react"
import type { Metadata } from "next"
import { pageMetadataFromKey } from "@/lib/config"
import { getDeals } from "@/lib/queries/deals"

import { Layout } from "@/components/layout"
import { DealsShowcase } from "@/components/deals/DealsShowcase"
import { Skeleton } from "@/components/ui/skeleton"

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("deals")
}

async function DealsContent() {
  const deals = await getDeals({ limit: 36 })
  return <DealsShowcase deals={deals} />
}

function DealsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-3/4 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function DealsPage() {
  return (
    <Layout>
      <main className="flex w-full flex-col items-center justify-center">
        <Suspense fallback={<DealsLoading />}>
          <DealsContent />
        </Suspense>
      </main>
    </Layout>
  )
}
