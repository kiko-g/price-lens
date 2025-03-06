"use client"

import { discountValueToPercentage, formatTimestamptz } from "@/lib/utils"
import { Price } from "@/types"
import axios from "axios"
import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Loader2, PencilIcon, CircleX } from "lucide-react"

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
          <Button variant="default">Export</Button>
        </div>
      </div>

      <div className="mt-8 flow-root w-full">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    PID
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    SPID
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Price Rec
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Price Unit
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Valid From
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Valid To
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Updated At
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {prices.map((price: Price) => (
                  <tr key={price.id}>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">{price.id}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                      {price.product_id}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                      {price.supermarket_product_id}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">{price.price}€</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">{price.price_recommended}€</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">{price.price_per_major_unit}€</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {price.discount ? discountValueToPercentage(price.discount) : "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {formatTimestamptz(price.valid_from)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {price.valid_to ? formatTimestamptz(price.valid_to) : "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {formatTimestamptz(price.updated_at)}
                    </td>

                    <td className="relative flex items-center gap-2 whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Button variant="ghost" size="icon-xs">
                        <PencilIcon />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatusWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center p-4">{children}</div>
}
