"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { type Product } from "@/types"
import { cn, PageStatus } from "@/lib/utils"

import { ProductCard } from "./ProductCard"
import { Loader2Icon, CircleOffIcon } from "lucide-react"

type Props = {
  ids: string[]
}

export function ProductsSelected({ ids }: Props) {
  const [status, setStatus] = useState(PageStatus.Loading)
  const [products, setProducts] = useState<Product[]>([])

  const isLoading = status === PageStatus.Loading

  async function fetchProducts() {
    setStatus(PageStatus.Loading)
    try {
      const { data } = await axios.get("/api/products/ids", {
        params: {
          ids: ids.join(","),
        },
      })
      setProducts(data.data || [])
    } catch (err) {
      setStatus(PageStatus.Error)
      console.error("Failed to fetch products:", err)
    } finally {
      setStatus(PageStatus.Loaded)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [ids])

  if (status === PageStatus.Error) {
    return (
      <Wrapper status={PageStatus.Error}>
        <CircleOffIcon className="h-6 w-6" />
        <p>Error fetching products. Please try again.</p>
      </Wrapper>
    )
  }

  if (isLoading) {
    return (
      <Wrapper status={PageStatus.Loading}>
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <p>Loading...</p>
      </Wrapper>
    )
  }

  if (products.length === 0 && status === PageStatus.Loaded) {
    return <Wrapper>No products found. Check back soon!</Wrapper>
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product, productIdx) => (
          <ProductCard key={`product-${productIdx}`} product={product} />
        ))}
      </div>
    </div>
  )
}

function Wrapper({ children, status = PageStatus.Loaded }: { children: React.ReactNode; status?: PageStatus }) {
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-4",
        status === PageStatus.Loading && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
        status === PageStatus.Loaded && "bg-zinc-100 dark:bg-zinc-900",
        status === PageStatus.Error && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
      )}
    >
      {children}
    </div>
  )
}
