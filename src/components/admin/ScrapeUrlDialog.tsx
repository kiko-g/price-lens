"use client"

import { useState } from "react"
import { Link2Icon } from "lucide-react"

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
        <Button className="hover:bg-accent px-2" variant="dropdown-item">
          Add product from URL
          <Link2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scrape Product URL</DialogTitle>
          <DialogDescription>
            Paste a product URL to scrape its data. The result will be logged in the console.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          <Label htmlFor="product-page-url">Product Page URL</Label>
          <Input id="product-page-url" value={url} onChange={(e) => setUrl(e.target.value)} className="col-span-3" />
        </div>

        <Button onClick={handleScrape}>Scrape</Button>
        {scrapedData && (
          <pre className="bg-muted mt-4 overflow-x-auto rounded-md p-4 text-xs">
            {JSON.stringify(scrapedData, null, 2)}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  )
}
