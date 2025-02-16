"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { type Product } from "@/types"

import { ProductCard } from "./ProductCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { CircleOffIcon, Loader2Icon, RefreshCcwIcon, SearchIcon } from "lucide-react"
import { cn, getCenteredArray, PageStatus } from "@/lib/utils"

export function ProductsGrid() {
  const [page, setPage] = useState(1)
  const [pageTotal, setPageTotal] = useState(50)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState(PageStatus.Loading)
  const [products, setProducts] = useState<Product[]>([])

  const isLoading = status === PageStatus.Loading

  async function fetchProducts() {
    setStatus(PageStatus.Loading)
    try {
      const { data } = await axios.get("/api/products", {
        params: {
          ...(query && { q: query }),
          page,
          limit: 40,
        },
      })
      setProducts(data.data || [])
      console.debug(data)
      setPageTotal(data.pagination.totalPages || 50)
    } catch (err) {
      setStatus(PageStatus.Error)
      console.error("Failed to fetch products:", err)
    } finally {
      setStatus(PageStatus.Loaded)
    }
  }

  async function updateProductsInPage() {
    setStatus(PageStatus.Loading)
    const urls = products.map((product) => product.url)

    try {
      await Promise.all(urls.map((url) => fetch(`/api/products/put?url=${url}`)))
      await fetchProducts()
    } catch (err) {
      console.warn("Failed to update products:", err)
    } finally {
      setStatus(PageStatus.Loaded)
    }
  }

  function handleSubmit() {
    setPage(1)
  }

  function handleNextPage() {
    setPage((p) => p + 1)
  }

  function handlePrevPage() {
    setPage((p) => p - 1)
  }

  function handlePageChange(value: string) {
    setPage(parseInt(value))
  }

  useEffect(() => {
    fetchProducts()
  }, [page])

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

          <Select value={page.toString()} onValueChange={handlePageChange}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder={page} />
            </SelectTrigger>
            <SelectContent>
              {getCenteredArray(50, page, pageTotal ? pageTotal : null).map((num: number) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, productIdx) => (
          <ProductCard key={`product-${productIdx}`} product={product} />
        ))}
      </div>

      <div className="flex w-full items-center justify-end gap-3">
        <Button variant="outline" size="icon" onClick={updateProductsInPage} disabled={isLoading}>
          <RefreshCcwIcon className={isLoading ? "animate-spin" : ""} />
        </Button>

        <div className="isolate flex -space-x-px">
          <Button
            variant="outline"
            className="rounded-r-none focus:z-10"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            Prev
          </Button>

          <Button variant="outline" className="rounded-none disabled:cursor-not-allowed disabled:opacity-100" disabled>
            {page}
          </Button>

          <Button variant="outline" className="rounded-l-none focus:z-10" onClick={handleNextPage}>
            Next
          </Button>
        </div>
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
