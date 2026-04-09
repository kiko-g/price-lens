"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/gamification/achievements"

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

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

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

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={TrendingDownIcon}
          label="Est. Savings"
          value={`${stats.estimated_savings.toFixed(2)}€`}
          color="text-green-600"
          description={`from ${stats.products_with_drops} price drops`}
        />
        <StatCard
          icon={HeartIcon}
          label="Favorites"
          value={String(stats.favorites_count)}
          color="text-red-500"
          description="products tracked"
        />
        <StatCard
          icon={BellIcon}
          label="Alerts"
          value={String(stats.alerts_count)}
          color="text-amber-500"
          description="active alerts"
        />
        <StatCard
          icon={FlameIcon}
          label="Streak"
          value={`${stats.streak} day${stats.streak !== 1 ? "s" : ""}`}
          color="text-orange-500"
          description="checking prices"
        />
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrophyIcon className="size-4 text-amber-500" />
            Achievements
            <Badge variant="secondary" className="text-[10px]">
              {stats.achievements.length}/{ACHIEVEMENTS.length}
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
