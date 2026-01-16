import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin",
  description: "Price Lens Admin Dashboard",
}

export default function Admin() {
  redirect("/admin/schedule")
}
