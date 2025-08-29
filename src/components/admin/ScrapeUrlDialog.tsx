"use client"

import Link from "next/link"
import { useState } from "react"
import { Link2Icon, LoaderPinwheelIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ScrapeUrlDialog() {
  const [url, setUrl] = useState("")
  const [scrapedData, setScrapedData] = useState<any>(null)

  const handleScrape = async () => {
    try {
      const response = await fetch("/api/products/store/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()
      console.debug(data)
      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape URL")
      }

      setScrapedData(data)
    } catch (error) {
      setScrapedData({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="hover:bg-accent cursor-pointer px-2" variant="dropdown-item">
          Add product from URL
          <Link2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add product from origin with link</DialogTitle>
          <DialogDescription>
            Paste a product URL to scrape its data. The result will be logged in the console.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          <Label htmlFor="product-page-url">Product page source URL</Label>

          <div className="flex items-center gap-2">
            <Input id="product-page-url" value={url} onChange={(e) => setUrl(e.target.value)} className="col-span-3" />
            <Button onClick={handleScrape} variant="primary">
              <LoaderPinwheelIcon className="h-4 w-4" />
              Scrape
            </Button>
          </div>
        </div>

        {scrapedData ? (
          <>
            <pre className="bg-muted max-h-96 overflow-x-auto rounded-md p-4 text-xs leading-3.5 text-wrap break-all">
              {JSON.stringify(scrapedData, null, 2)}
            </pre>

            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setScrapedData(null)} className="w-full">
                <TrashIcon className="h-4 w-4" />
                Clear
              </Button>

              {scrapedData?.product?.url && (
                <Button
                  variant="default"
                  onClick={() => window.open(scrapedData.product.url, "_blank")}
                  className="w-full"
                  asChild
                >
                  <Link href={`/supermarket/${scrapedData.product.id}`} target="_blank">
                    <Link2Icon className="h-4 w-4" />
                    Visit product page
                  </Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="bg-muted rounded-md p-4 text-center">Your result will appear here</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
