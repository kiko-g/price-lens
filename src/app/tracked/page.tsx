import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { StoreProductsTracked } from "@/components/model/StoreProductsTracked"
import { getTrackedProducts } from "./actions"

export const metadata: Metadata = {
  title: "Tracked Products",
  description:
    "Track prices of essential products across Portuguese supermarkets. Get real insights into price changes and inflation trends.",
}

type SearchParams = {
  q?: string
  page?: string
  origin?: string
  priority?: string
}

type TrackedPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function TrackedPage({ searchParams }: TrackedPageProps) {
  const params = await searchParams
  const query = params.q || ""
  const origin = params.origin || undefined
  const priority = params.priority || undefined

  const initialData = await getTrackedProducts({
    page: 1,
    limit: 30,
    query,
    origin,
    priority,
  })

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <StoreProductsTracked initialData={initialData} initialQuery={query} />
      </div>
    </Layout>
  )
}
