"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { type SupermarketProduct } from "@/types"
import { FrontendStatus } from "@/types/extra"

import { searchTypes, type SortByType, type SearchType } from "@/types/extra"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import { getCenteredArray } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { SupermarketProductCard, ProductCardSkeleton } from "@/components/model/SupermarketProductCard"
import { Wrapper } from "@/components/SectionWrapper"

import {
  ArrowDownAZ,
  ArrowDownAZIcon,
  ArrowDownWideNarrowIcon,
  ArrowUpAZ,
  ArrowUpAZIcon,
  ArrowUpWideNarrowIcon,
  CircleOffIcon,
  DeleteIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react"

type Props = {
  page?: number
  q?: string
  t?: SearchType
  sort?: SortByType
}

export function SupermarketProductsGrid(props: Props) {
  const { page: initPage = 1, q: initQuery = "", t: initSearchType = "name", sort: initSortBy = "a-z" } = props

  const limit = 10
  const router = useRouter()

  const [page, setPage] = useState(initPage)
  const [sortBy, setSortBy] = useState<SortByType>(initSortBy)
  const [searchType, setSearchType] = useState<SearchType>(initSearchType)
  const [query, setQuery] = useState(initQuery)
  const [paginationTotal, setPaginationTotal] = useState(50)
  const [pagedCount, setPagedCount] = useState(0)
  const [status, setStatus] = useState(FrontendStatus.Loading)
  const [products, setProducts] = useState<SupermarketProduct[]>([])

  const updateParams = useUpdateSearchParams()

  const isLoading = status === FrontendStatus.Loading

  async function fetchProducts() {
    setStatus(FrontendStatus.Loading)
    try {
      const { data } = await axios.get("/api/products", {
        params: {
          ...(query && { q: query }),
          page,
          limit,
          searchType,
          sort: sortBy,
        },
      })
      setProducts(data.data || [])
      setPagedCount(data.pagination.pagedCount || 0)
      setPaginationTotal(data.pagination.totalPages || 50)
    } catch (err) {
      setPage(1)
      setStatus(FrontendStatus.Error)
      console.error("Failed to fetch products:", err)
    } finally {
      setStatus(FrontendStatus.Loaded)
    }
  }

  async function updateProduct(product: SupermarketProduct): Promise<boolean> {
    if (!product || !product.url) return false

    const response = await fetch(`/api/products/replace?url=${product.url}`)
    const data = await response.json()

    if (response.status === 200) {
      setProducts(products.map((p) => (p.url === product.url ? (data.product as SupermarketProduct) : p)))
      return true
    } else {
      console.error(data)
      return false
    }
  }

  async function updateProductsInPage() {
    setStatus(FrontendStatus.Loading)
    const urls = products.map((product) => product.url)

    try {
      for (const url of urls) {
        await fetch(`/api/products/replace?url=${url}`)
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      await fetchProducts()
    } catch (err) {
      console.warn("Failed to update products:", err)
    } finally {
      setStatus(FrontendStatus.Loaded)
    }
  }

  function handleSubmit() {
    setPage(1)
    if (page === 1) fetchProducts()
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

  function clearSearch() {
    setQuery("")
    setSearchType("name")
    page !== 1 ? setPage(1) : fetchProducts()
  }

  useEffect(() => {
    fetchProducts()
  }, [page, sortBy])

  useEffect(() => {
    updateParams({ page, q: query, t: searchType, sort: sortBy })
  }, [page, query, searchType, sortBy])

  if (status === FrontendStatus.Error) {
    return (
      <Wrapper status={FrontendStatus.Error}>
        <CircleOffIcon className="h-6 w-6" />
        <p>Error fetching products. Please try again.</p>
        <Button
          variant="default"
          onClick={() => {
            location.reload()
          }}
        >
          <span>Try again</span>
          <RefreshCcwIcon />
        </Button>
      </Wrapper>
    )
  }

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: limit }).map((_, index) => (
          <ProductCardSkeleton key={`product-skeleton-${index}`} />
        ))}
      </div>
    )
  }

  if (products.length === 0 && status === FrontendStatus.Loaded) {
    return (
      <Wrapper>
        <CircleOffIcon className="h-8 w-8" />
        <p>No products found. Check back soon!</p>
        <Button
          variant="default"
          onClick={() => {
            updateParams(null)
            location.reload()
          }}
        >
          <span>Clear search</span>
          <DeleteIcon />
        </Button>
      </Wrapper>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="mb-4 flex w-full flex-col items-end justify-between gap-2 md:mb-2 md:gap-6 lg:flex-row lg:items-center">
        <div className="flex w-full flex-1 gap-2">
          <div className="relative w-full">
            <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-8"
              value={query}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleSubmit()
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value
                if (typeof value === "string") setQuery(value)
              }}
            />
            <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
              <SelectTrigger className="absolute right-2 top-1/2 flex h-4 w-auto -translate-y-1/2 items-center justify-center border-0 py-2 pl-1 pr-0 text-xs text-muted-foreground shadow-none transition hover:bg-black/5 dark:hover:bg-white/5">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Search by</SelectLabel>
                  {searchTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem asChild>
                <Button variant="dropdown-item" onClick={clearSearch}>
                  Clear search
                  <DeleteIcon />
                </Button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="warning" asChild>
                <Button variant="dropdown-item" onClick={updateProductsInPage} disabled={isLoading}>
                  Update products
                  <RefreshCcwIcon className={isLoading ? "animate-spin" : ""} />
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <div className="isolate flex flex-1 -space-x-px">
            <Button
              variant="outline"
              className="rounded-r-none focus:z-10"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              Prev
            </Button>

            <Select value={page.toString()} onValueChange={handlePageChange}>
              <SelectTrigger className="w-auto justify-center rounded-none lg:w-full">
                <SelectValue placeholder={page} />
              </SelectTrigger>
              <SelectContent>
                {getCenteredArray(Math.min(paginationTotal, 50), page, paginationTotal ? paginationTotal : null).map(
                  (num: number) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            <Button variant="outline" className="rounded-l-none focus:z-10" onClick={handleNextPage}>
              Next
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-auto justify-start lg:w-[120px]">
                {sortBy === "a-z" && <ArrowDownAZIcon className="mr-2 h-4 w-4" />}
                {sortBy === "z-a" && <ArrowUpAZIcon className="mr-2 h-4 w-4" />}
                {sortBy === "price-low-high" && <ArrowUpWideNarrowIcon className="mr-2 h-4 w-4" />}
                {sortBy === "price-high-low" && <ArrowDownWideNarrowIcon className="mr-2 h-4 w-4" />}
                {sortBy === "only-nulls" && <CircleOffIcon className="mr-2 h-4 w-4" />}
                Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("a-z")}>
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                Name A-Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("z-a")}>
                <ArrowUpAZ className="mr-2 h-4 w-4" />
                Name Z-A
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-high-low")}>
                <ArrowUpWideNarrowIcon className="mr-2 h-4 w-4" />
                Price: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-low-high")}>
                <ArrowDownWideNarrowIcon className="mr-2 h-4 w-4" />
                Price: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("only-nulls")}>
                <CircleOffIcon className="mr-2 h-4 w-4" />
                Invalid products
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default" disabled={isLoading} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagedCount)} of {pagedCount} results
        </span>

        <span>
          Page {page}/{paginationTotal}
        </span>
      </div>

      <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product, productIdx) => (
          <SupermarketProductCard
            key={`product-${productIdx}`}
            product={product}
            onUpdate={() => updateProduct(product)}
          />
        ))}
      </div>
    </div>
  )
}
