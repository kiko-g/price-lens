"use client"

import { useId } from "react"
import Image from "next/image"
import { redirect, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { signInWithGoogle } from "./actions"
import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Callout } from "@/components/ui/callout"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import type { HomeStats } from "@/lib/queries/home-stats"
import {
  AlertCircleIcon,
  FlaskConicalIcon,
  HeartIcon,
  TrendingDownIcon,
  RefreshCwIcon,
  Package,
  LineChartIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const IS_DEV = process.env.NODE_ENV === "development"

const benefitKeys = ["favorites", "alerts", "sync"] as const
const benefitIcons = {
  favorites: HeartIcon,
  alerts: TrendingDownIcon,
  sync: RefreshCwIcon,
} as const

function LoginInsightSparkline({ className }: { className?: string }) {
  const rawId = useId()
  const gradId = `loginSparkFill-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`
  return (
    <svg viewBox="0 0 140 48" className={cn("text-primary max-h-14 w-full max-w-[200px]", className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.2} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d="M4 34 C 22 34, 26 12, 44 18 S 68 40, 86 22 S 104 8, 136 26 L 136 48 L 4 48 Z" fill={`url(#${gradId})`} />
      <path
        d="M4 34 C 22 34, 26 12, 44 18 S 68 40, 86 22 S 104 8, 136 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LoginClient({ stats }: { stats: HomeStats }) {
  const { user, isLoading } = useUser()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const nextParam = searchParams.get("next")
  const t = useTranslations("auth.login")

  if (isLoading) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2 md:items-start md:gap-12">
          <div className="flex flex-col items-center gap-4 md:max-w-md md:items-start">
            <Skeleton className="h-9 w-56 md:w-72" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <div className="flex w-full max-w-md flex-col gap-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full max-w-md rounded-lg" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="hidden md:flex md:flex-col md:gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="min-h-[160px] w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    redirect(nextParam || "/profile")
  }

  const resolveErrorMessage = (): string | null => {
    if (!errorParam) return null
    if (errorParam === "origin-missing") return t("errors.origin-missing")
    return t("errors.default")
  }
  const errorMessage = resolveErrorMessage()

  return (
    <div className="relative flex w-full grow flex-col items-center justify-center px-4 py-8 md:py-12">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="relative z-10 grid w-full max-w-5xl gap-8 md:grid-cols-2 md:items-center md:gap-12">
        <div className={cn("flex flex-col justify-center", "items-center text-center md:items-start md:text-left")}>
          <div className="flex w-full max-w-md flex-col">
            <h1 className="text-foreground mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-2xl font-semibold md:justify-start">
              <span>{t("loginTo")}</span>
              <span className="inline-flex items-center">
                <Image src="/price-lens.svg" alt="" width={24} height={24} className="mr-1" />
                <span className="tracking-tighter">{t("brandName")}</span>
              </span>
            </h1>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{t("subtitle")}</p>

            <ul className="mb-6 flex w-full flex-col gap-3 text-left">
              {benefitKeys.map((key) => {
                const Icon = benefitIcons[key]
                return (
                  <li key={key} className="flex gap-3 rounded-xl bg-transparent px-3 py-3 backdrop-blur-sm">
                    <div className="bg-secondary/15 dark:bg-secondary/30 text-secondary-900 dark:text-secondary-50 flex size-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground font-medium">{t(`benefits.${key}.title`)}</p>
                      <p className="text-muted-foreground text-sm leading-snug">{t(`benefits.${key}.desc`)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {errorMessage && (
              <div className="bg-destructive/10 text-destructive mb-4 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <form action={signInWithGoogle} className="w-full">
              {nextParam && <input type="hidden" name="next" value={nextParam} />}
              <Button type="submit" variant="marketing-default" className="w-full" size="lg">
                <GoogleIcon />
                {t("continueWithGoogle")}
              </Button>
            </form>

            {IS_DEV && (
              <div className="mt-6 w-full">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-dashed" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">{t("devOnly")}</span>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full border-dashed font-mono text-xs">
                  <a href="/api/auth/dev-login">
                    <FlaskConicalIcon className="h-3.5 w-3.5" />
                    {t("signInAsDev")}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                {t("valueVisual.label")}
              </p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-snug">{t("valueVisual.subtitle")}</p>
            </div>

            <div className="bg-background/80 flex gap-3 rounded-xl border p-3">
              <div
                className="bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-lg"
                aria-hidden
              >
                <Package className="size-8 opacity-60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
                  {t("valueVisual.mockProductName")}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-500">
                    {t("valueVisual.mockPriceCurrent")}
                  </span>
                  <span className="text-muted-foreground text-xs line-through">{t("valueVisual.mockPriceWas")}</span>
                  <Badge variant="discount" size="2xs" roundedness="sm" className="tabular-nums">
                    {t("valueVisual.mockDiscountBadge")}
                  </Badge>
                </div>
              </div>
              <HeartIcon className="text-primary mt-0.5 size-5 shrink-0 fill-current" aria-hidden />
            </div>

            <div className="bg-muted/25 rounded-xl border p-4">
              <p className="text-foreground text-sm font-semibold">{t("valueVisual.insightTitle")}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t("valueVisual.insightLead")}</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <LoginInsightSparkline />
                  <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-wide uppercase">
                    {t("valueVisual.chartHint")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <Badge variant="success" size="2xs" roundedness="sm" className="w-fit font-medium">
                    {t("valueVisual.timingExample")}
                  </Badge>
                  <Badge variant="outline" size="2xs" roundedness="sm" className="w-fit text-xs font-normal">
                    {t("valueVisual.volatilityExample")}
                  </Badge>
                </div>
              </div>
            </div>

            <Callout variant="info" icon={LineChartIcon} className="text-left">
              <p className="text-foreground font-semibold">{t("valueVisual.guidanceTitle")}</p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{t("valueVisual.guidanceBody")}</p>
            </Callout>

            {stats.perStore.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {stats.perStore.map((store) => (
                  <SupermarketChainBadge
                    key={store.originId}
                    originId={store.originId}
                    variant="logo"
                    className="h-5 w-auto opacity-90 grayscale-0 transition-opacity hover:opacity-100 hover:grayscale-0"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
