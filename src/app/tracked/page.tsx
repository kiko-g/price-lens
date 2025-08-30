import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { StoreProductsTracked } from "@/components/model/StoreProductsTracked"
import { getTrackedProducts } from "./actions"

export const metadata: Metadata = {
  title: "Tracked Products - Price Lens",
  description:
    "Track prices of essential products across Portuguese supermarkets. Get real insights into price changes and inflation trends.",
}

type SearchParams = {
  q?: string
  page?: string
  origin?: string
}

type TrackedPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function TrackedPage({ searchParams }: TrackedPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const query = params.q || ""
  const originId = params.origin ? parseInt(params.origin, 10) : 0

  const initialData = await getTrackedProducts({
    page,
    limit: 30,
    query,
    originId,
  })

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <StoreProductsTracked
          initialData={initialData}
          initialQuery={query}
          initialOriginId={originId}
          initialPage={page}
        />
      </div>
    </Layout>
  )
}
