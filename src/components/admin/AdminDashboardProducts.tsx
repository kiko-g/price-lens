"use client"

import axios from "axios"
import { cn } from "@/lib/utils"
import { Product } from "@/types"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"

import { Loader2, CircleX, TrashIcon } from "lucide-react"
import { InsertPriceModal } from "./InsertPriceModal"

export function AdminDashboardProducts() {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<any>(null)

  async function fetchProducts() {
    setIsLoading(true)

    try {
      const response = await axios.get("/api/products/shallow")
      if (response.status === 200) {
        setProducts(response.data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <StatusWrapper>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading...</span>
      </StatusWrapper>
    )
  }

  if (!products)
    return (
      <StatusWrapper>
        <CircleX className="h-4 w-4" />
        <span className="text-sm">
          Error fetching <pre></pre>
        </span>
      </StatusWrapper>
    )

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="flex flex-col sm:flex-auto">
          <h1 className="text-base font-semibold">Products</h1>
          <p className="mt-2 text-sm">
            A table of the products entries in the database. Showing {products.length} products.
          </p>
        </div>
        <div className="flex">
          <InsertPriceModal />
        </div>
      </div>

      <div className="flow-root w-full">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <HeaderCell>ID</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                  <HeaderCell>Name</HeaderCell>
                  <HeaderCell>Brand</HeaderCell>
                  <HeaderCell>Category</HeaderCell>
                  <HeaderCell>Product Ref IDs</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products
                  .sort((a: Product, b: Product) => {
                    if (a?.id && b?.id) return a.id - b.id
                    return 0
                  })
                  .map((product: Product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductRow({ product: initialProduct }: { product: Product }) {
  const [product, setProduct] = useState(initialProduct)
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleDeleteProduct(id?: number) {
    if (!id || typeof id !== "number") return

    setIsUpdating(true)
    const response = await axios.delete("/api/products/shallow/delete", { data: { id } })
    if (response.status === 200) {
      setProduct(response.data.data)
    }
    setIsUpdating(false)
  }

  if (!product) return null

  return (
    <tr key={product.id} className={cn(isUpdating ? "animate-pulse" : "")}>
      <Cell>{product.id}</Cell>
      <Cell>
        <Button
          variant="ghost-destructive"
          size="icon-xs"
          onClick={() => handleDeleteProduct(product.id)}
          disabled={isUpdating}
        >
          <TrashIcon />
        </Button>
      </Cell>
      <Cell>{product.name}</Cell>
      <Cell>{product.brand}</Cell>
      <Cell>{product.category}</Cell>
      <Cell>{product.product_ref_ids.join(", ")}</Cell>
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

const Cell = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <td
      className={cn("text-muted-foreground space-x-1 px-2 py-2 text-sm tracking-tighter whitespace-nowrap", className)}
    >
      {children}
    </td>
  )
}
