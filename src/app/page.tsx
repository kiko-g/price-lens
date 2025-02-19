import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { ProductsGrid } from "@/components/model/ProductsGrid"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

type SearchParams = {
  page?: string
}

type HomeProps = {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await Promise.resolve(searchParams)
  const page = params.page ? parseInt(params.page) : 1

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <ProductsGrid page={page} />
      </div>
    </Layout>
  )
}
