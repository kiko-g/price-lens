import type { Metadata } from "next"
import { Layout } from "@/components/layout"
import { AdminDashboard } from "@/components/admin/AdminDashboard"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Admin() {
  return (
    <Layout>
      <AdminDashboard />
    </Layout>
  )
}
