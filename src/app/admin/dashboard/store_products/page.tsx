import type { Metadata } from "next"
import { Layout } from "@/components/layout"
import { AdminDashboardStoreProducts } from "@/components/admin/AdminDashboardStoreProducts"

export const metadata: Metadata = {
  title: "Dashboard Store Products",
  description: "Admin view of store products in the database",
}

export default function AdminDashboardStoreProductsPage() {
  return (
    <Layout>
      <AdminDashboardStoreProducts />
    </Layout>
  )
}

