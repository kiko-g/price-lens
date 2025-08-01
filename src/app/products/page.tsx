import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Products } from "@/components/model/Products"

export const metadata: Metadata = {
  title: "Products",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

type SearchParams = {
  q?: string
  page?: string
}

type HomeProps = {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage({ searchParams }: HomeProps) {
  const params = await Promise.resolve(searchParams)
  const page = params.page ? parseInt(params.page) : 1 // TODO: add pagination ?
  const q = params.q ?? "" // TODO: add search

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <Products />
      </div>
    </Layout>
  )
}
