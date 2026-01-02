"use client"

import Link from "next/link"
import { useState } from "react"
import { Link2Icon, LoaderPinwheelIcon, TrashIcon, Loader2 } from "lucide-react"
import { useScrapeProductUrl } from "@/hooks/useAdmin"
import type { StoreProduct } from "@/types"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Code } from "@/components/ui/combo/code"

type ScrapeResult = { product: StoreProduct } | { error: string }

export function ScrapeUrlDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [scrapedData, setScrapedData] = useState<ScrapeResult | null>(null)
  const scrapeMutation = useScrapeProductUrl()

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setUrl("")
      setScrapedData(null)
    }
  }

  const handleScrape = () => {
    scrapeMutation.mutate(url, {
      onSuccess: (data) => {
        console.info(data)
        setScrapedData(data)
      },
      onError: (error) => {
        setScrapedData({
          error: error instanceof Error ? error.message : "Unknown error",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <Label htmlFor="product-page-url" className="mb-1">
            Product page source URL
          </Label>

          <div className="flex items-center gap-2">
            <Input
              id="product-page-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3 text-base md:text-sm"
              placeholder="https://www.continente.pt/produto/leite-949202.html"
            />

            <Button onClick={handleScrape} variant="primary" disabled={!url || scrapeMutation.isPending}>
              {scrapeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LoaderPinwheelIcon className="h-4 w-4" />
              )}
              Request
            </Button>
          </div>
        </div>

        {scrapedData ? (
          <div className="flex flex-col gap-3">
            <ScrollArea className="max-h-[300px] rounded-md border">
              <Code className="text-xs">{JSON.stringify(scrapedData, null, 2)}</Code>
            </ScrollArea>

            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setScrapedData(null)} className="w-full">
                <TrashIcon className="h-4 w-4" />
                Clear
              </Button>

              {"product" in scrapedData && (
                <Button variant="default" className="w-full" asChild>
                  <Link href={`/products/${scrapedData.product.id}`} target="_blank">
                    <Link2Icon className="h-4 w-4" />
                    Visit product page
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-muted rounded-md border px-4 py-8 text-center text-sm">Your result will appear here</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
