"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BellIcon, ChartNetworkIcon, ShoppingBagIcon, SparklesIcon } from "lucide-react"

const roadmapFeatures = [
  {
    title: "Full price history",
    description: "Unlimited custom product tracking with deep historical data and trend analysis.",
    icon: ChartNetworkIcon,
    status: "available" as const,
  },
  {
    title: "Price alerts",
    description: "Get notified when products you track drop in price. Set custom thresholds per product.",
    icon: BellIcon,
    status: "building" as const,
  },
  {
    title: "Shopping list optimizer",
    description: "Optimize your shopping list across different supermarket sources. Get the best deals and save time.",
    icon: ShoppingBagIcon,
    status: "building" as const,
  },
]

const statusLabels = {
  available: "Available",
  building: "In development",
} as const

export function PlanTab({ plan: _plan }: { plan?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SparklesIcon className="text-primary h-5 w-5" />
        <h2 className="text-2xl font-bold">Price Lens is free</h2>
      </div>
      <p className="text-muted-foreground text-sm">
        Price Lens is completely free during early access. We&apos;re actively building new features to help you save
        money on groceries. Here&apos;s what&apos;s on our roadmap:
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {roadmapFeatures.map((f) => (
          <Card key={f.title}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                <f.icon className="h-4 w-4" />
                {f.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1.5">
              <p className="text-muted-foreground mb-2 text-sm">{f.description}</p>
              <Badge variant={f.status === "available" ? "default" : "secondary"} className="text-xs">
                {statusLabels[f.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
