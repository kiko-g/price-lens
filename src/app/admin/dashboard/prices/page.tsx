import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminDashboardPrices } from "@/components/admin/AdminDashboardPrices"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard Prices",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

export default function AdminDashboardPricesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminDashboardPrices />
    </Suspense>
  )
}
