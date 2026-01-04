"use client"

import { useState } from "react"
import { cn, discountValueToPercentage, formatTimestamptz } from "@/lib/utils"
import type { Price } from "@/types"
import { InsertPriceModal } from "./InsertPriceModal"
import { AdminPagination, useAdminPagination } from "./AdminPagination"
import { useAdminPrices, useSanitizePrices } from "@/hooks/useAdmin"

import { HideFooter } from "@/contexts/FooterContext"
import { Button } from "@/components/ui/button"

import { Loader2, PencilIcon, CircleX, CopyIcon, CheckIcon, SparklesIcon, RefreshCcwIcon } from "lucide-react"

export function AdminDashboardPrices() {
  const pagination = useAdminPagination(50)
  const { data, isLoading, error, refetch } = useAdminPrices(pagination)

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
        <span className="text-sm">Error fetching prices</span>
      </StatusWrapper>
    )

  const prices = data.data
  const paginationData = data.pagination

  return (
    <div className="w-full p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24">
      <HideFooter />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold">Price Points</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            All price entries in the database, sorted by store product ID and valid_from date.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcwIcon />
          </Button>
          <InsertPriceModal />
        </div>
      </div>

      <div className="mt-8 flow-root w-full">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <HeaderCell>ID</HeaderCell>
                  <HeaderCell>SPID</HeaderCell>
                  <HeaderCell>Price</HeaderCell>
                  <HeaderCell>Price Rec</HeaderCell>
                  <HeaderCell>Price Unit</HeaderCell>
                  <HeaderCell>Discount</HeaderCell>
                  <HeaderCell>Updated At</HeaderCell>
                  <HeaderCell>Valid From</HeaderCell>
                  <HeaderCell>Valid To</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y">
                {prices.map((price: Price) => (
                  <PriceRow key={price.id} price={price} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPagination
        page={paginationData.page}
        limit={paginationData.limit}
        totalCount={paginationData.totalCount}
        totalPages={paginationData.totalPages}
      />
    </div>
  )
}

function PriceRow({ price }: { price: Price }) {
  const [isCopying, setIsCopying] = useState(false)
  const sanitizeMutation = useSanitizePrices()

  return (
    <tr key={price.id} className="hover:bg-muted/50 transition-colors duration-200">
      <Cell>{price.id}</Cell>
      <Cell>{price.store_product_id}</Cell>
      <Cell>{price.price}€</Cell>
      <Cell>{price.price_recommended}€</Cell>
      <Cell>{price.price_per_major_unit}€</Cell>
      <Cell>{price.discount ? discountValueToPercentage(price.discount) : "N/A"}</Cell>
      <Cell>{formatTimestamptz(price.updated_at)}</Cell>
      <Cell>{formatTimestamptz(price.valid_from)}</Cell>
      <Cell>{price.valid_to ? formatTimestamptz(price.valid_to) : "N/A"}</Cell>

      <Cell>
        <Button variant="ghost" size="icon-xs" onClick={() => {}}>
          <PencilIcon />
        </Button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={async () => {
            setIsCopying(true)
            await setTimeout(() => {
              navigator.clipboard.writeText(JSON.stringify(price, null, 2))
              setIsCopying(false)
            }, 1000)
          }}
          disabled={isCopying}
        >
          {isCopying ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon />}
        </Button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => price.store_product_id && sanitizeMutation.mutate(price.store_product_id)}
          disabled={sanitizeMutation.isPending}
        >
          {sanitizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon />}
        </Button>
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

const Cell = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <td className={cn("text-muted-foreground px-2 py-2 text-sm tracking-tighter whitespace-nowrap", className)}>
      {children}
    </td>
  )
}
