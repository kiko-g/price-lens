"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/gamification/achievements"
import { isLocale, type Locale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

import { TrendingDownIcon, HeartIcon, BellIcon, FlameIcon, TrophyIcon, LockIcon } from "lucide-react"

interface UserStats {
  favorites_count: number
  alerts_count: number
  estimated_savings: number
  products_with_drops: number
  streak: number
  achievements: string[]
}

export function SavingsTab() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("profile.savingsTab")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setStats(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("[SavingsTab] failed to load stats:", err)
        setError(t("loadError"))
        setIsLoading(false)
      })
  }, [t])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return <p className="text-destructive py-8 text-center text-sm">{error}</p>
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={TrendingDownIcon}
          label={t("stats.savingsLabel")}
          value={formatPrice(stats.estimated_savings, locale)}
          color="text-green-600"
          description={t("stats.savingsDescription", { count: stats.products_with_drops })}
        />
        <StatCard
          icon={HeartIcon}
          label={t("stats.favoritesLabel")}
          value={String(stats.favorites_count)}
          color="text-red-500"
          description={t("stats.favoritesDescription")}
        />
        <StatCard
          icon={BellIcon}
          label={t("stats.alertsLabel")}
          value={String(stats.alerts_count)}
          color="text-amber-500"
          description={t("stats.alertsDescription")}
        />
        <StatCard
          icon={FlameIcon}
          label={t("stats.streakLabel")}
          value={t("stats.streakValue", { count: stats.streak })}
          color="text-orange-500"
          description={t("stats.streakDescription")}
        />
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrophyIcon className="size-4 text-amber-500" />
            {t("achievementsTitle")}
            <Badge variant="secondary" className="text-[10px]">
              {t("achievementsProgress", {
                unlocked: stats.achievements.length,
                total: ACHIEVEMENTS.length,
              })}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = stats.achievements.includes(achievement.key)
              return <AchievementCard key={achievement.key} achievement={achievement} unlocked={unlocked} />
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  description,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center p-4 text-center">
        <Icon className={cn("mb-1.5 size-5", color)} />
        <p className="text-lg leading-tight font-bold">{value}</p>
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        <p className="text-muted-foreground mt-0.5 text-[10px]">{description}</p>
      </CardContent>
    </Card>
  )
}

function AchievementCard({ achievement, unlocked }: { achievement: AchievementDef; unlocked: boolean }) {
  const Icon = unlocked ? achievement.icon : LockIcon

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all",
        unlocked ? "bg-primary/5 border-primary/20" : "border-border bg-muted/30 opacity-50",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </div>
      <p className="text-[11px] leading-tight font-semibold">{achievement.title}</p>
      <p className="text-muted-foreground text-[9px] leading-tight">{achievement.description}</p>
    </div>
  )
}
