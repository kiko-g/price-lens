import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { ProductsGrid } from "@/components/model/ProductsGrid"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Home() {
  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <ProductsGrid />
      </div>
    </Layout>
  )
}
