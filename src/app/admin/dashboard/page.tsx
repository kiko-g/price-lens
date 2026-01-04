import Link from "next/link"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { DollarSignIcon, PackageIcon, ShoppingCartIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard hub for Price Lens",
}

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="w-full p-4 md:p-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Inspect and manage database tables</p>
        </div>

        <div className="grid h-fit w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
          <DashboardLink
            href="/admin/dashboard/prices"
            icon={DollarSignIcon}
            title="Prices"
            description="View all price entries in the database. Sanitize and manage price history."
          />
          <DashboardLink
            href="/admin/dashboard/products"
            icon={PackageIcon}
            title="Products"
            description="View generic product entries (cross-store matching candidates)."
          />
          <DashboardLink
            href="/admin/dashboard/store_products"
            icon={ShoppingCartIcon}
            title="Store Products"
            description="View scraped store products with their current prices and priorities."
          />
        </div>
      </div>
    </Layout>
  )
}

type DashboardLinkProps = {
  href: string
  icon: React.ElementType
  title: string
  description: string
}

function DashboardLink({ href, icon: Icon, title, description }: DashboardLinkProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href={href}>View {title}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

