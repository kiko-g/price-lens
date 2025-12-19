import Link from "next/link"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PackageIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Admin() {
  return (
    <Layout>
      <div className="grid h-fit w-full grid-cols-1 gap-4 p-4 md:grid-cols-3 md:gap-8 md:p-12">
        <AdminDashboardProductsLink />
        <AdminDashboardPricesLink />
        <TestScrapers />
        <AdminCoreActions />
      </div>
    </Layout>
  )
}

function AdminDashboardProductsLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>Access the admin dashboard to manage your account and settings.</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/dashboard/products">Access Dashboard for Products</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function AdminDashboardPricesLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prices</CardTitle>
      </CardHeader>
      <CardContent>Access the admin dashboard to manage your account and settings.</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/dashboard/prices">Access Dashboard for Prices</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function TestScrapers() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Scrapers</CardTitle>
      </CardHeader>
      <CardContent>Test the api scrapers and visualize the results</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/test">Test Scrapers</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function AdminCoreActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Perform administrative actions from the UI.</p>
        <div className="flex w-full flex-col gap-2">
          <Button asChild variant="success" className="w-fit justify-start">
            <Link href="/api/cron" target="_blank">
              <PackageIcon className="h-4 w-4" />
              Run main cron job
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
