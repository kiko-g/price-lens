import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { ProductsChosen } from "@/components/model/ProductsChosen"

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
        <ProductsChosen />
      </div>
    </Layout>
  )
}
