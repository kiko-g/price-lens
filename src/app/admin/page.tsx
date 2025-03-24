import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Admin() {
  if (process.env.NODE_ENV !== "development") redirect("/")

  return (
    <Layout>
      <div className="grid w-full grid-cols-1 grid-rows-3 gap-4 p-4 md:grid-cols-3 md:grid-rows-2 md:gap-8 md:p-12">
        <AdminActionsLink />
        <AdminDashboardLink />
      </div>
    </Layout>
  )
}

function AdminActionsLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>Access the admin actions to manage your account and settings.</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/actions">Access Actions</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function AdminDashboardLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>Access the admin dashboard to manage your account and settings.</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/dashboard">Access Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
