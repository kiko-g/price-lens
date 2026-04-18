"use client"

import { useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BellIcon, ChartNetworkIcon, ShoppingBagIcon, SparklesIcon } from "lucide-react"

const roadmapFeatures = [
  { key: "history", icon: ChartNetworkIcon, status: "available" as const },
  { key: "alerts", icon: BellIcon, status: "building" as const },
  { key: "shoppingList", icon: ShoppingBagIcon, status: "building" as const },
] as const

export function PlanTab({ plan: _plan }: { plan?: string }) {
  const t = useTranslations("profile.planTab")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SparklesIcon className="text-primary h-5 w-5" />
        <h2 className="text-2xl font-bold">{t("title")}</h2>
      </div>
      <p className="text-muted-foreground text-sm">{t("intro")}</p>

      <div className="grid gap-3 md:grid-cols-3">
        {roadmapFeatures.map((f) => (
          <Card key={f.key}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                <f.icon className="h-4 w-4" />
                {t(`features.${f.key}.title` as const)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1.5">
              <p className="text-muted-foreground mb-2 text-sm">{t(`features.${f.key}.description` as const)}</p>
              <Badge variant={f.status === "available" ? "default" : "secondary"} className="text-xs">
                {t(`status.${f.status}` as const)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
