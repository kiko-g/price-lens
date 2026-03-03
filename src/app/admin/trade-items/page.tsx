import { Suspense } from "react"
import type { Metadata } from "next"
import { TradeItemExplorer } from "@/components/admin/TradeItemExplorer"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Trade Items",
  description: "Explore trade items and Open Food Facts enrichment data",
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

export default function TradeItemsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TradeItemExplorer />
    </Suspense>
  )
}
