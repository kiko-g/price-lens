import type { Metadata } from "next"
import { getSearchType, getSortByType, SortByType, type SearchType } from "@/types/extra"

import { Layout } from "@/components/layout"
import { StoreProductsGrid } from "@/components/model/StoreProductsGrid"

export const metadata: Metadata = {
  title: "Supermarket",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

type SearchParams = {
  q?: string
  t?: SearchType
  s?: SortByType
  page?: string
  essential?: string
}

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function Supermarket({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams)
  const page = params.page ? parseInt(params.page) : 1
  const searchType = getSearchType(params.t ?? "name")
  const sortBy = getSortByType(params.s ?? "a-z")
  const q = params.q ?? ""
  const essential = params.essential !== "false"

  return (
    <Layout>
      <StoreProductsGrid page={page} q={q} t={searchType} sort={sortBy} essential={essential} />
    </Layout>
  )
}
