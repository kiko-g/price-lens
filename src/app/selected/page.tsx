import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { ProductsSelected } from "@/components/model/ProductsSelected"
import { selectedProducts } from "@/lib/db/queries/products"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

type SearchParams = {
  q?: string
  page?: string
}

type HomeProps = {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await Promise.resolve(searchParams)

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <ProductsSelected ids={selectedProducts.map((p) => p.id)} />
      </div>
    </Layout>
  )
}
