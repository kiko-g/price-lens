import type { Metadata } from "next"
import { Layout } from "@/components/layout"
import { AdminDashboardPrices } from "@/components/admin/AdminDashboardPrices"

export const metadata: Metadata = {
  title: "Dashboard Prices",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function AdminDashboardPricesPage() {
  return (
    <Layout>
      <AdminDashboardPrices />
    </Layout>
  )
}
