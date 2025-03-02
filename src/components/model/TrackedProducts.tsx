"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { ProductFromSupermarket } from "@/types"
import { FrontendStatus } from "@/types/extra"
import { cn } from "@/lib/utils"

import { Loader2Icon, CircleOffIcon } from "lucide-react"
import { ProductCard } from "./ProductCard"

export function TrackedProducts() {
  const [status, setStatus] = useState(FrontendStatus.Loading)
  const [products, setProducts] = useState<ProductFromSupermarket[]>([])

  const isLoading = status === FrontendStatus.Loading

  async function fetchProducts() {
    setStatus(FrontendStatus.Loading)
    try {
      const { data } = await axios.get("/api/products/tracked")
      const products = data.data || []
      console.debug(products)
      setProducts(products)
    } catch (err) {
      setStatus(FrontendStatus.Error)
      console.error("Failed to fetch products:", err)
    } finally {
      setStatus(FrontendStatus.Loaded)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (status === FrontendStatus.Error) {
    return (
      <Wrapper status={FrontendStatus.Error}>
        <CircleOffIcon className="h-6 w-6" />
        <p>Error fetching products. Please try again.</p>
      </Wrapper>
    )
  }

  if (isLoading) {
    return (
      <Wrapper status={FrontendStatus.Loading}>
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <p>Loading...</p>
      </Wrapper>
    )
  }

  if (products.length === 0 && status === FrontendStatus.Loaded) {
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

function Wrapper({ children, status = FrontendStatus.Loaded }: { children: React.ReactNode; status?: FrontendStatus }) {
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-4",
        status === FrontendStatus.Loading && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
        status === FrontendStatus.Loaded && "bg-zinc-100 dark:bg-zinc-900",
        status === FrontendStatus.Error && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
      )}
    >
      {children}
    </div>
  )
}
