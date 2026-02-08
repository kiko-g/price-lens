"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

import {
  RefreshCwIcon,
  PackageIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ActivityIcon,
  BarcodeIcon,
  CrownIcon,
  DatabaseIcon,
  TrendingUpIcon,
  ClockIcon,
} from "lucide-react"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"

interface OverviewData {
  scrapeStatus: {
    neverScraped: number
    unavailable: number
    available: number
    total: number
  }
  productsByOrigin: Array<{
    origin_id: number
    name: string
    total: number
    available: number
    unavailable: number
  }>
  recentlyScraped24h: number
  totalPricePoints: number
  productsWithBarcode: number
  highPriorityProducts: number
  generatedAt: string
}

const STORE_LOGOS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: ContinenteSvg,
  2: AuchanSvg,
  3: PingoDoceSvg,
}

const STORE_NAMES: Record<number, string> = {
  1: "Continente",
  2: "Auchan",
  3: "Pingo Doce",
}

export default function OverviewPage() {
  const {
    data: overview,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/overview")
      return res.data as OverviewData
    },
    staleTime: 60000,
  })

  const scrapeStatus = overview?.scrapeStatus
  const availablePercent = scrapeStatus ? (scrapeStatus.available / scrapeStatus.total) * 100 : 0
  const barcodePercent = overview ? (overview.productsWithBarcode / scrapeStatus!.total) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Overview</h1>
            <p className="text-muted-foreground text-sm">Key performance indicators and system health</p>
          </div>
          <div className="flex items-center justify-start gap-3">
            {dataUpdatedAt ? (
              <span className="text-muted-foreground text-xs">Updated {format(dataUpdatedAt, "HH:mm:ss")}</span>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Scrape Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ActivityIcon className="text-primary size-5" />
              Scrape Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Available */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground text-sm font-medium">Available</span>
                </div>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-24" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-emerald-500">{scrapeStatus?.available.toLocaleString()}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">Successfully scraped products</p>
              </div>

              {/* Unavailable */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground text-sm font-medium">Unavailable</span>
                </div>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-24" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-amber-500">{scrapeStatus?.unavailable.toLocaleString()}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">404&apos;d / removed from store</p>
              </div>

              {/* Never Scraped */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CircleDashedIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground text-sm font-medium">Never Scraped</span>
                </div>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-24" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-blue-500">{scrapeStatus?.neverScraped.toLocaleString()}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">Awaiting first scrape attempt</p>
              </div>

              {/* Total */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-4 w-4" />
                  <span className="text-muted-foreground text-sm font-medium">Total Products</span>
                </div>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-24" />
                ) : (
                  <p className="mt-2 text-2xl font-bold">{scrapeStatus?.total.toLocaleString()}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">All store products in database</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Availability Rate</span>
                <span className="font-medium">{availablePercent.toFixed(1)}%</span>
              </div>
              <Progress value={availablePercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Two Column Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Products by Store */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DatabaseIcon className="text-primary size-5" />
                Products by Store
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {isLoading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : (
                  overview?.productsByOrigin.map((origin) => {
                    const Logo = STORE_LOGOS[origin.origin_id]
                    const availablePercent = origin.total > 0 ? (origin.available / origin.total) * 100 : 0
                    return (
                      <div key={origin.origin_id}>
                        <div className="mb-2 h-full flex-1 self-stretch">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Logo className="h-6 w-20" />
                            </div>
                            <span className="font-semibold">{origin.total.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2">
                          {/* Progress */}
                          <div className="flex w-full flex-1 items-center gap-2">
                            <div className="bg-destructive h-2 flex-1 overflow-hidden rounded-full">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${availablePercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Labels */}
                          <div className="flex gap-5 text-xs">
                            <span className="flex items-center gap-1">
                              <span className="bg-success h-2 w-2 rounded-full" />
                              <span className="text-muted-foreground">Available</span>
                              <span className="font-medium">
                                {origin.available.toLocaleString()} ({availablePercent.toFixed(1)}%)
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="bg-destructive h-2 w-2 rounded-full" />
                              <span className="text-muted-foreground">Unavailable</span>
                              <span className="font-medium">
                                {origin.unavailable.toLocaleString()} ({(100 - availablePercent).toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUpIcon className="text-primary size-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Recently Scraped */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">Last 24h</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-16" />
                  ) : (
                    <p className="mt-2 text-xl font-bold">{overview?.recentlyScraped24h.toLocaleString()}</p>
                  )}
                  <p className="text-muted-foreground text-xs">products scraped</p>
                </div>

                {/* Price Points */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">Price Points</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-16" />
                  ) : (
                    <p className="mt-2 text-xl font-bold">{overview?.totalPricePoints.toLocaleString()}</p>
                  )}
                  <p className="text-muted-foreground text-xs">historical records</p>
                </div>

                {/* Barcodes */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <BarcodeIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">With Barcode</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-16" />
                  ) : (
                    <p className="mt-2 text-xl font-bold">{overview?.productsWithBarcode.toLocaleString()}</p>
                  )}
                  <p className="text-muted-foreground text-xs">{barcodePercent.toFixed(1)}% coverage</p>
                </div>

                {/* High Priority */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CrownIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">High Priority</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-16" />
                  ) : (
                    <p className="mt-2 text-xl font-bold">{overview?.highPriorityProducts.toLocaleString()}</p>
                  )}
                  <p className="text-muted-foreground text-xs">P3-P5 products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
