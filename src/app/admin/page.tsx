import Link from "next/link"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { PackageIcon, CrownIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Admin() {
  return (
    <Layout>
      <div className="grid h-fit w-full grid-cols-1 gap-4 p-4 md:grid-cols-3 md:gap-8 md:p-12">
        <SectionAdminDashboardProductsLink />
        <SectionAdminDashboardPricesLink />
        <SectionAdminPrioritiesLink />
        <SectionPriorityJob />
        <SectionTestScrapers />
        <SectionAdminCoreActions />
      </div>
    </Layout>
  )
}

function SectionAdminDashboardProductsLink() {
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

function SectionAdminDashboardPricesLink() {
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

function SectionAdminPrioritiesLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CrownIcon className="h-5 w-5" />
          Product Priorities
        </CardTitle>
      </CardHeader>
      <CardContent>Manually assign priority levels (0-5) to products for better organization.</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/priorities">Manage Priorities</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function SectionPriorityJob() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Job</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Run the priority job to classify products into priorities.</p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/admin/priorities/ai">Playground for AI Priority Classifier</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function SectionTestScrapers() {
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

function SectionAdminCoreActions() {
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
