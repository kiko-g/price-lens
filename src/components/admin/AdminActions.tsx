"use client"

import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { priceQueries } from "@/lib/db/queries/prices"

export function AdminActions() {
  return (
    <div className="grid h-fit w-full grid-cols-1 gap-4 p-4 md:grid-cols-3">
      <QueueUrlsCard />
      <ReplaceBlankCard />
      <ReplaceInvalidCard />
      <RunCronJobCard />
      <DeleteDuplicatePricePointsCard />
      <DeleteAllPricePointsCard />
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
    setIsLoading(true)
    try {
      const { data } = await axios.get("/api/products/replace/blank")
      console.debug(data)
    } catch (error) {
      console.error("Error replacing blank products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const [isLoading, setIsLoading] = useState(false)

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Replace Blank Products</h3>
          <p className="text-sm text-muted-foreground">
            Replace blank products by scraping their URLs again. This will update any products that are missing data.
          </p>
        </div>
        <Button className="h-fit" onClick={replaceBlank} disabled={isLoading}>
          {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
          Replace Blank
        </Button>
      </div>
    </AdminActionCard>
  )
}

export function ReplaceInvalidCard() {
  const replaceInvalid = async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get("/api/products/replace/invalid")
      console.debug(data)
    } catch (error) {
      console.error("Error replacing invalid products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const [isLoading, setIsLoading] = useState(false)

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Replace Invalid Products</h3>
          <p className="text-sm text-muted-foreground">
            Replace invalid products by scraping their URLs again. This will update any products that are missing data.
          </p>
        </div>
        <Button className="h-fit" onClick={replaceInvalid} disabled={isLoading}>
          {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
          Replace Invalid
        </Button>
      </div>
    </AdminActionCard>
  )
}

export function RunCronJobCard() {
  const [isLoading, setIsLoading] = useState(false)

  const runCronJob = async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get("/api/cron")
      console.debug(data)
    } catch (error) {
      console.error("Error running cron job:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Run Cron Job</h3>
          <p className="text-sm text-muted-foreground">
            Run the cron job. This will scrape the URLs and update the database.
          </p>
        </div>
        <Button className="h-fit" onClick={runCronJob} disabled={isLoading} variant="success">
          {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
          Run Cron Job
        </Button>
      </div>
    </AdminActionCard>
  )
}

export function DeleteDuplicatePricePointsCard() {
  const [isLoading, setIsLoading] = useState(false)

  async function deleteDuplicatePricePoints() {
    setIsLoading(true)
    try {
      await axios.get("/api/prices/delete/duplicate")
      console.debug("Duplicate price points deleted")
    } catch (error) {
      console.error("Error deleting duplicate price points:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Delete Duplicate Price Points</h3>
          <p className="text-sm text-muted-foreground">
            Delete duplicate price points. This will delete any price points that are the same as the previous one.
          </p>
        </div>
        <Button className="h-fit" onClick={deleteDuplicatePricePoints} disabled={isLoading} variant="destructive">
          {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
          Delete Duplicate Price Points
        </Button>
      </div>
    </AdminActionCard>
  )
}

export function DeleteAllPricePointsCard() {
  const [isLoading, setIsLoading] = useState(false)

  async function deleteAllPricePoints() {
    setIsLoading(true)
    try {
      await axios.get("/api/prices/delete/all")
    } catch (error) {
      console.error("Error deleting all price points:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminActionCard>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-medium">Delete All Price Points</h3>
          <p className="text-sm text-muted-foreground">
            Delete all price points. This will delete all price points from the database.
          </p>
        </div>
        <Button className="h-fit" onClick={deleteAllPricePoints} disabled={isLoading} variant="destructive">
          {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
          Delete All Price Points
        </Button>
      </div>
    </AdminActionCard>
  )
}
