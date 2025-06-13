import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Products } from "@/components/model/Products"
import { getSearchType } from "@/types/extra"
import { Scrapers } from "@/lib/scraper"

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

export default async function Home({ searchParams }: HomeProps) {
  const params = await Promise.resolve(searchParams)
  const page = params.page ? parseInt(params.page) : 1
  const q = params.q ?? ""

  console.debug(
    await Scrapers.auchan.productPage(
      "https://www.auchan.pt/pt/alimentacao/congelados/peixe/peixe-inteiro-e-posta/sardinha-nacional-peniche-congelada-800-g/2736681.html",
    ),
  )

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <Products />
      </div>
    </Layout>
  )
}
