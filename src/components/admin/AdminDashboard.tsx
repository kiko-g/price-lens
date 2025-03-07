"use client"

import axios from "axios"
import { cn, discountValueToPercentage, formatTimestamptz } from "@/lib/utils"
import { Price } from "@/types"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"

import { Loader2, PencilIcon, CircleX, CopyIcon, CheckIcon } from "lucide-react"
import { InsertPriceModal } from "./InsertPriceModal"

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [prices, setPrices] = useState<any>(null)

  async function fetchPrices() {
    setIsLoading(true)

    try {
      const data = await axios.get("/api/prices/get")
      if (data.status === 200) {
        setPrices(data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  if (isLoading) {
    return (
      <StatusWrapper>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading...</span>
      </StatusWrapper>
    )
  }

  if (!prices)
    return (
      <StatusWrapper>
        <CircleX className="h-4 w-4" />
        <span className="text-sm">Error fetching prices</span>
      </StatusWrapper>
    )

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold">Price Points</h1>
          <p className="mt-2 text-sm">A table of placeholder stock market data that does not make any sense.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
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
                  <HeaderCell>PID</HeaderCell>
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
    </div>
  )
}

function PriceRow({ price }: { price: Price }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  return (
    <tr key={price.id}>
      <Cell>{price.id}</Cell>
      <Cell>{price.product_id}</Cell>
      <Cell>{price.supermarket_product_id}</Cell>
      <Cell>{price.price}€</Cell>
      <Cell>{price.price_recommended}€</Cell>
      <Cell>{price.price_per_major_unit}€</Cell>
      <Cell>{price.discount ? discountValueToPercentage(price.discount) : "N/A"}</Cell>
      <Cell>{formatTimestamptz(price.updated_at)}</Cell>
      <Cell>{formatTimestamptz(price.valid_from)}</Cell>
      <Cell>{price.valid_to ? formatTimestamptz(price.valid_to) : "N/A"}</Cell>

      <Cell>
        <Button variant="ghost" size="icon-xs" onClick={() => setIsEditing(true)}>
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
      </Cell>
    </tr>
  )
}

const StatusWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center p-4">{children}</div>
}

const HeaderCell = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <th scope="col" className={cn("whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold", className)}>
      {children}
    </th>
  )
}

const Cell = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <td className={cn("whitespace-nowrap px-2 py-2 text-sm tracking-tighter text-muted-foreground", className)}>
      {children}
    </td>
  )
}
