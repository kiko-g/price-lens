import type { Metadata } from "next"
import { AdminDashboardProducts } from "@/components/admin/AdminDashboardProducts"

export const metadata: Metadata = {
  title: "Dashboard Products",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function AdminDashboardProductsPage() {
  return <AdminDashboardProducts />
}
