"use client"

import { cn } from "@/lib/utils"
import type { StoreProduct } from "@/types"
import { useAdminStoreProducts } from "@/hooks/useAdmin"
import { AdminPagination, useAdminPagination } from "./AdminPagination"

import { Button } from "@/components/ui/button"

import { Loader2, CircleX, RefreshCcwIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { HideFooter } from "@/contexts/FooterContext"

export function AdminDashboardStoreProducts() {
  const pagination = useAdminPagination(50)
  const { data, isLoading, error, refetch } = useAdminStoreProducts(pagination)

  if (isLoading) {
    return (
      <StatusWrapper>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading...</span>
      </StatusWrapper>
    )
  }

  if (error || !data?.data)
    return (
      <StatusWrapper>
        <CircleX className="h-4 w-4" />
        <span className="text-sm">Error fetching store products</span>
      </StatusWrapper>
    )

  const products = data.data
  const paginationData = data.pagination

  return (
    <div className="w-full p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24">
      <HideFooter />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold">Store Products</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            All scraped store products with their current prices and priorities.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcwIcon />
          </Button>
        </div>
      </div>

      <div className="mt-8 flow-root w-full">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <HeaderCell>ID</HeaderCell>
                  <HeaderCell>Origin</HeaderCell>
                  <HeaderCell>Name</HeaderCell>
                  <HeaderCell>Brand</HeaderCell>
                  <HeaderCell>Price</HeaderCell>
                  <HeaderCell>Priority</HeaderCell>
                  <HeaderCell>Source</HeaderCell>
                  <HeaderCell>Category</HeaderCell>
                  <HeaderCell>Link</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product: StoreProduct) => (
                  <StoreProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPagination
        page={paginationData.page}
        limit={paginationData.limit}
        totalCount={paginationData.pagedCount}
        totalPages={paginationData.totalPages}
        hasNextPage={paginationData.hasNextPage}
      />
    </div>
  )
}

function StoreProductRow({ product }: { product: StoreProduct }) {
  return (
    <tr className="hover:bg-muted/50 transition-colors duration-200">
      <Cell>{product.id}</Cell>
      <Cell>{product.origin_id}</Cell>
      <Cell className="max-w-[200px] truncate" title={product.name}>
        {product.name}
      </Cell>
      <Cell>{product.brand ?? "-"}</Cell>
      <Cell>{product.price}€</Cell>
      <Cell>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            product.priority === null && "bg-muted text-muted-foreground",
            product.priority === 0 && "bg-gray-100 text-gray-800",
            product.priority === 1 && "bg-green-100 text-green-800",
            product.priority === 2 && "bg-blue-100 text-blue-800",
            product.priority === 3 && "bg-yellow-100 text-yellow-800",
            product.priority === 4 && "bg-orange-100 text-orange-800",
            product.priority === 5 && "bg-red-100 text-red-800",
          )}
        >
          {product.priority ?? "none"}
        </span>
      </Cell>
      <Cell>{product.priority_source ?? "-"}</Cell>
      <Cell className="max-w-[150px] truncate" title={product.category ?? undefined}>
        {product.category ?? "-"}
      </Cell>
      <Cell>
        <Link href={product.url} target="_blank" className="text-primary hover:underline">
          <ExternalLinkIcon className="h-4 w-4" />
        </Link>
      </Cell>
    </tr>
  )
}

const StatusWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center p-4">{children}</div>
}

const HeaderCell = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <th scope="col" className={cn("px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap", className)}>
      {children}
    </th>
  )
}

const Cell = ({ className, title, children }: { className?: string; title?: string; children: React.ReactNode }) => {
  return (
    <td
      className={cn("text-muted-foreground px-2 py-2 text-sm tracking-tighter whitespace-nowrap", className)}
      title={title}
    >
      {children}
    </td>
  )
}
