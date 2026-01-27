"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { RefreshCwIcon, LayersIcon, LinkIcon, AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"
import type { CategoryMappingStats, CanonicalCategory } from "@/types"
import { CanonicalCategoryTree } from "./components/CanonicalCategoryTree"
import { CategoryMappingsTable } from "./components/CategoryMappingsTable"

interface OverallStats {
  total_canonical_categories: number
  total_mappings: number
  stores: CategoryMappingStats[]
}

const STORE_LOGOS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: ContinenteSvg,
  2: AuchanSvg,
  3: PingoDoceSvg,
}

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<string>("overview")

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["admin-categories-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/categories/stats")
      return res.data.data as OverallStats
    },
    staleTime: 60000,
  })

  const { data: canonicalTree, isLoading: treeLoading } = useQuery({
    queryKey: ["canonical-categories-tree"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/categories/canonical?format=tree")
      return res.data.data as CanonicalCategory[]
    },
    staleTime: 60000,
  })

  const totalTuples = stats?.stores.reduce((sum, s) => sum + s.total_tuples, 0) ?? 0
  const totalMapped = stats?.stores.reduce((sum, s) => sum + s.mapped_tuples, 0) ?? 0
  const totalUnmapped = totalTuples - totalMapped
  const overallCoverage = totalTuples > 0 ? (totalMapped / totalTuples) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Category Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage canonical categories and map store-specific categories
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dataUpdatedAt && (
              <span className="text-muted-foreground text-xs">Updated {format(dataUpdatedAt, "HH:mm:ss")}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Canonical Categories */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <LayersIcon className="text-primary h-5 w-5" />
                <span className="text-muted-foreground text-sm font-medium">Canonical Categories</span>
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{stats?.total_canonical_categories ?? 0}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">in your unified taxonomy</p>
            </CardContent>
          </Card>

          {/* Total Mappings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-emerald-500" />
                <span className="text-muted-foreground text-sm font-medium">Active Mappings</span>
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-emerald-500">{stats?.total_mappings ?? 0}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">store categories linked</p>
            </CardContent>
          </Card>

          {/* Mapped Tuples */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-5 w-5 text-blue-500" />
                <span className="text-muted-foreground text-sm font-medium">Mapped</span>
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-blue-500">{totalMapped}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">of {totalTuples} unique tuples</p>
            </CardContent>
          </Card>

          {/* Unmapped Tuples */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                <span className="text-muted-foreground text-sm font-medium">Unmapped</span>
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-amber-500">{totalUnmapped}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Coverage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Overall Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category tuples mapped to canonical</span>
                <span className="font-medium">{overallCoverage.toFixed(1)}%</span>
              </div>
              <Progress value={overallCoverage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Coverage by Store */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Coverage by Store</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {statsLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : stats?.stores.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No category data yet. Run the SQL migration first.
                </p>
              ) : (
                stats?.stores.map((store) => {
                  const Logo = STORE_LOGOS[store.origin_id]
                  return (
                    <div key={store.origin_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {Logo && <Logo className="h-5 w-16" />}
                          <span className="text-muted-foreground text-sm">{store.origin_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <span className="text-foreground font-medium">{store.mapped_tuples}</span> /{" "}
                            {store.total_tuples} tuples
                          </span>
                          <span className="font-semibold">{store.coverage_percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-amber-500/20">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${store.coverage_percentage}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-muted-foreground">
                          <span className="text-foreground font-medium">{store.mapped_products.toLocaleString()}</span>{" "}
                          products covered
                        </span>
                        <span className="text-muted-foreground">
                          <span className="font-medium text-amber-600">{store.unmapped_tuples}</span> tuples need
                          mapping
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Canonical Tree and Mappings */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Canonical Categories</TabsTrigger>
            <TabsTrigger value="mappings">Store Mappings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <CanonicalCategoryTree categories={canonicalTree ?? []} isLoading={treeLoading} />
          </TabsContent>

          <TabsContent value="mappings" className="mt-4">
            <CategoryMappingsTable canonicalCategories={canonicalTree ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
