import { Suspense } from "react"
import type { Metadata } from "next"
import { Layout } from "@/components/layout"
import { AdminDashboardStoreProducts } from "@/components/admin/AdminDashboardStoreProducts"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard Store Products",
  description: "Admin view of store products in the database",
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

export default function AdminDashboardStoreProductsPage() {
  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboardStoreProducts />
      </Suspense>
    </Layout>
  )
}
