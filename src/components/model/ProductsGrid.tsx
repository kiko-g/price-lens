"use client"

import { useEffect, useState } from "react"
import type { Product } from "@/types"
import { ProductCard } from "./ProductCard"

export function ProductsGrid() {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products")
        const json = await res.json()
        setProducts(json.data || [])
      } catch (err) {
        console.error("Failed to fetch products:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (isLoading) {
    return <Wrapper>Loading...</Wrapper>
  }

  if (products.length === 0) {
    return <Wrapper>No products found. Check back soon!</Wrapper>
  }

  return (
    <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, productIdx) => (
        <ProductCard key={`product-${productIdx}`} product={product} />
      ))}
    </div>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-4 rounded-lg border bg-zinc-100 p-4 dark:bg-zinc-900">{children}</div>
}
