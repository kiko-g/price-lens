import Link from "next/link"
import type { Metadata } from "next"
import type { LucideIcon } from "lucide-react"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import {
  DatabaseIcon,
  CrownIcon,
  RefreshCwIcon,
  SparklesIcon,
  FlaskConicalIcon,
  CalendarClockIcon,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Admin",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

interface AdminCard {
  title: string
  description: string
  href: string
  buttonText: string
  icon?: LucideIcon
}

const ADMIN_CARDS: AdminCard[] = [
  {
    title: "Database Dashboard",
    description: "Inspect database tables: prices, products, and store products.",
    href: "/admin/dashboard",
    buttonText: "Open Dashboard",
    icon: DatabaseIcon,
  },
  {
    title: "Product Priorities",
    description: "Manually assign priority levels (0-5) to products for better organization.",
    href: "/admin/priorities",
    buttonText: "Manage Priorities",
    icon: CrownIcon,
  },
  {
    title: "Bulk Re-Scrape",
    description: "Re-scrape products to update data and discover missing barcodes.",
    href: "/admin/bulk-scrape",
    buttonText: "Open Bulk Scrape",
    icon: RefreshCwIcon,
  },
  {
    title: "Scrape Schedule",
    description: "Visualize product scraping schedule and staleness by priority level.",
    href: "/admin/schedule",
    buttonText: "View Schedule",
    icon: CalendarClockIcon,
  },
  {
    title: "AI Priority Classifier",
    description: "Run the priority job to classify products into priorities using AI.",
    href: "/admin/priorities/ai",
    buttonText: "Open Classifier",
    icon: SparklesIcon,
  },
  {
    title: "Test Scrapers",
    description: "Test the API scrapers and visualize the results.",
    href: "/admin/test",
    buttonText: "Test Scrapers",
    icon: FlaskConicalIcon,
  },
]

export default async function Admin() {
  return (
    <Layout>
      <div className="grid h-fit w-full grid-cols-1 gap-4 p-4 md:grid-cols-3 md:gap-8 md:p-12">
        {ADMIN_CARDS.map((card) => (
          <AdminCardComponent key={card.href} {...card} />
        ))}
      </div>
    </Layout>
  )
}

function AdminCardComponent({ title, description, href, buttonText, icon: Icon }: AdminCard) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{description}</CardContent>
      <CardFooter>
        <Button asChild>
          <Link href={href}>{buttonText}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
