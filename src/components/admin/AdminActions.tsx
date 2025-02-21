"use client"

import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function AdminActions() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-2">
      <QueueUrlsCard />
      <ReplaceBlankCard />
    </div>
  )
}

export function AdminActionCard({ children }: { children: React.ReactNode }) {
  return <Card className="h-fit w-full p-4">{children}</Card>
}

export function QueueUrlsCard() {
  const queueUrls = async () => {
    const { data } = await axios.get("/api/cron/urls")
    console.log(data)
  }

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Queue URLs</h3>
          <p className="text-sm text-muted-foreground">
            Queue new URLs to be scraped. This will add them to the queue and start scraping them in the background.
          </p>
        </div>
        <Button className="h-fit" onClick={queueUrls}>
          Queue New URLs
        </Button>
      </div>
    </AdminActionCard>
  )
}

export function ReplaceBlankCard() {
  const replaceBlank = async () => {
    const { data } = await axios.get("/api/products/replace/blank")
    console.log(data)
  }

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Replace Blank Products</h3>
          <p className="text-sm text-muted-foreground">
            Replace blank products by scraping their URLs again. This will update any products that are missing data.
          </p>
        </div>
        <Button className="h-fit" onClick={replaceBlank}>
          Replace Blank
        </Button>
      </div>
    </AdminActionCard>
  )
}
