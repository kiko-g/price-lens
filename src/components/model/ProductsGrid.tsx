"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import type { Product } from "@/types"

import { Input } from "@/components/ui/input"
import { ProductCard } from "./ProductCard"

import { Loader2Icon, RefreshCcwIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductsGrid() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [products, setProducts] = useState<Product[]>([])

  async function fetchProducts() {
    setIsLoading(true)
    try {
      const { data } = await axios.get("/api/products", {
        params: {
          ...(query && { q: query }),
          page,
        },
      })
      setProducts(data.data || [])
    } catch (err) {
      console.error("Failed to fetch products:", err)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateProductsInPage() {
    setIsLoading(true)
    const urls = products.map((product) => product.url)

    try {
      await Promise.all(urls.map((url) => fetch(`/api/products/put?url=${url}`)))
      await fetchProducts()
    } catch (err) {
      console.error("Failed to update products:", err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit() {
    setPage(1)
    fetchProducts()
  }

  function handleNextPage() {
    setPage((p) => p + 1)
  }

  function handlePrevPage() {
    setPage((p) => p - 1)
  }

  useEffect(() => {
    fetchProducts()
  }, [page])

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
    <div className="flex w-full flex-col gap-1">
      <div className="mb-2 flex w-full items-center justify-between gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-8"
            value={query}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") fetchProducts()
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </div>

        <div className="isolate flex -space-x-px">
          <Button
            variant="outline"
            className="rounded-r-none focus:z-10"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            Prev
          </Button>

          <Button variant="outline" className="rounded-l-none focus:z-10" onClick={handleNextPage}>
            Next
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={updateProductsInPage} disabled={isLoading}>
          <RefreshCcwIcon className={isLoading ? "animate-spin" : ""} />
        </Button>

        <Button variant="default" disabled={isLoading} onClick={handleSubmit}>
          Submit
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {products.length} products</span>
        <span>Page {page}</span>
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
