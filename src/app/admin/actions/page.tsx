import type { Metadata } from "next"
import { Layout } from "@/components/layout"
import { AdminActions } from "@/components/admin/AdminActions"

export const metadata: Metadata = {
  title: "Admin Actions",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Admin() {
  return (
    <Layout>
      <AdminActions />
    </Layout>
  )
}
