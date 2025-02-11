"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import type { Product } from "@/types"

import { Input } from "@/components/ui/input"
import { ProductCard } from "./ProductCard"

import { Loader2Icon, SearchIcon } from "lucide-react"
import { Button } from "../ui/button"

export function ProductsGrid() {
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])

  async function fetchProducts() {
    try {
      const { data } = await axios.get("/api/products", {
        params: {
          ...(query && { q: query }),
        },
      })
      setProducts(data.data || [])
    } catch (err) {
      console.error("Failed to fetch products:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <Wrapper>
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <p>Loading...</p>
      </Wrapper>
    )
  }

  if (products.length === 0) {
    return <Wrapper>No products found. Check back soon!</Wrapper>
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-8"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </div>

        <Button variant="default" onClick={fetchProducts}>
          Submit
        </Button>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, productIdx) => (
          <ProductCard key={`product-${productIdx}`} product={product} />
        ))}
      </div>
    </div>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border bg-zinc-100 p-4 dark:bg-zinc-900">
      {children}
    </div>
  )
}
