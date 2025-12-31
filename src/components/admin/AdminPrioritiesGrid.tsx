"use client"

import { type StoreProduct } from "@/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminProductPriorityCard } from "./AdminProductPriorityCard"
import { SearchIcon } from "lucide-react"

type Props = {
  initialData: {
    products: StoreProduct[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasMore: boolean
    }
  }
  initPage: number
  initQuery: string
  initPriorityFilter: string
}

export function AdminPrioritiesGrid({ initialData, initPage, initQuery, initPriorityFilter }: Props) {
  const router = useRouter()
  const [page, setPage] = useState(initPage)
  const [query, setQuery] = useState(initQuery)
  const [priorityFilter, setPriorityFilter] = useState(initPriorityFilter)
  const [products, setProducts] = useState<StoreProduct[]>(initialData.products)

  const { totalCount, totalPages } = initialData.pagination

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (priorityFilter !== "all") params.set("priority", priorityFilter)
    params.set("page", "1")
    router.push(`/admin/priorities?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (priorityFilter !== "all") params.set("priority", priorityFilter)
    params.set("page", newPage.toString())
    router.push(`/admin/priorities?${params.toString()}`)
  }

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (value !== "all") params.set("priority", value)
    params.set("page", "1")
    router.push(`/admin/priorities?${params.toString()}`)
  }

  const handleProductUpdate = (updatedProduct: StoreProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Product Priority Management</h1>
        <p className="text-muted-foreground text-sm">Manually assign priorities to products (0-5 scale)</p>
      </div>

      {/* Controls */}
      <div className="flex w-full flex-col gap-4 rounded-lg border p-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <div className="relative flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by product name..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter by priority:</span>
          <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="null">Unprioritized (null)</SelectItem>
              <SelectItem value="0">Priority 0 (Niche)</SelectItem>
              <SelectItem value="1">Priority 1 (Rare)</SelectItem>
              <SelectItem value="2">Priority 2 (Occasional)</SelectItem>
              <SelectItem value="3">Priority 3 (Moderate)</SelectItem>
              <SelectItem value="4">Priority 4 (Frequent)</SelectItem>
              <SelectItem value="5">Priority 5 (Essential)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            Showing <span className="text-foreground font-semibold">{(page - 1) * 48 + 1}</span> to{" "}
            <span className="text-foreground font-semibold">{Math.min(page * 48, totalCount)}</span> of{" "}
            <span className="text-foreground font-semibold">{totalCount}</span> products
          </span>
          <span>
            Page <span className="text-foreground font-semibold">{page}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages}</span>
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {products.map((product) => (
            <AdminProductPriorityCard key={product.id} product={product} onUpdate={handleProductUpdate} />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground flex min-h-[400px] items-center justify-center text-center">
          <div>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
          Previous
        </Button>
        <span className="text-muted-foreground px-4 text-sm">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
          Next
        </Button>
      </div>
    </div>
  )
}
