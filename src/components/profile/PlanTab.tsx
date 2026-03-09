"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BellIcon, ChartNetworkIcon, ShoppingBagIcon } from "lucide-react"

const features = [
  {
    title: "Full price history",
    description: "No more 14-day limit and access to unlimited custom product tracking.",
    icon: ChartNetworkIcon,
  },
  {
    title: "Price alerts",
    description:
      "Get notified of price changes and save money. Get breakdowns of evolutions of price points and campaigns.",
    icon: BellIcon,
  },
  {
    title: "Shopping list optimizer",
    description: "Optimize your shopping list across different supermarket sources. Get the best deals and save time.",
    icon: ShoppingBagIcon,
  },
]

export function PlanTab({ plan }: { plan?: string }) {
  const isPlus = plan === "plus"

  if (isPlus) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Price Lens Plus</h2>
          <span className="text-muted-foreground text-sm">Active</span>
        </div>
        <p className="text-muted-foreground text-sm">
          You have access to all Plus features. Thank you for your support!
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader className="p-4 pb-0">
                <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                  <f.icon className="h-4 w-4" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1.5">
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Upgrade to Plus</h2>
        <div className="text-xl font-bold md:text-3xl">
          €5<span className="text-muted-foreground text-base font-semibold">/month</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                <f.icon className="h-4 w-4" />
                {f.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1.5">
              <p className="text-muted-foreground text-sm">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="marketing" className="w-full md:w-1/2">
        Upgrade Now
      </Button>
    </div>
  )
}
