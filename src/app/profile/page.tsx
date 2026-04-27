"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useUser } from "@/hooks/useUser"
import { useUserAlerts } from "@/hooks/useUserAlerts"
import { isLocale, type Locale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"

import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { ProfileSidebar } from "@/components/profile/ProfileSidebar"
import { FavoritesTab } from "@/components/profile/FavoritesTab"
import { ListsTab } from "@/components/profile/ListsTab"
import { PlanTab } from "@/components/profile/PlanTab"
import { SavingsTab } from "@/components/profile/SavingsTab"
import { SettingsTab } from "@/components/profile/SettingsTab"

import { EmptyStateView } from "@/components/ui/combo/state-views"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BellIcon, CreditCardIcon, HeartIcon, ListIcon, SettingsIcon, TrophyIcon } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading } = useUser()
  const tTabs = useTranslations("profile.tabs")

  if (!isLoading && !user) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex w-full items-start justify-start">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="container mx-auto max-w-[1600px] space-y-6 p-4 pt-6 md:p-6 md:pt-8">
        {isLoading ? (
          <ProfilePageSkeleton />
        ) : (
          <div className="flex grow flex-col gap-6 pb-6 md:flex-row">
            <ProfileSidebar user={user!} profile={profile} />

            <div className="min-w-0 flex-1">
              <Tabs defaultValue="favorites">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="favorites" className="gap-1.5">
                    <HeartIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tTabs("favorites")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="lists" className="gap-1.5">
                    <ListIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tTabs("lists")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="gap-1.5">
                    <BellIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tTabs("alerts")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="savings" className="gap-1.5">
                    <TrophyIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tTabs("savings")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="gap-1.5">
                    <CreditCardIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tTabs("plan")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5">
                    <SettingsIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tTabs("settings")}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="mt-4">
                  <FavoritesTab />
                </TabsContent>

                <TabsContent value="lists" className="mt-4">
                  <ListsTab />
                </TabsContent>

                <TabsContent value="alerts" className="mt-4">
                  <AlertsTab />
                </TabsContent>

                <TabsContent value="savings" className="mt-4">
                  <SavingsTab />
                </TabsContent>

                <TabsContent value="plan" className="mt-4">
                  <PlanTab plan={profile?.plan} />
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <SettingsTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AlertsTab() {
  const { data: alerts, isLoading } = useUserAlerts()
  const t = useTranslations("profile.alertsTab")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!alerts || alerts.length === 0) {
    return <EmptyStateView icon={BellIcon} title={t("emptyTitle")} message={t("emptyMessage")} />
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">{t("summary", { count: alerts.length })}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {alerts.map((alert) => {
          const product = alert.store_products
          if (!product) return null
          const thresholdLabel = alert.threshold_type === "any_drop" ? t("anyDrop") : alert.threshold_type
          const priceDetail = `${formatPrice(product.price, locale)} · ${thresholdLabel}`
          return (
            <Link
              key={alert.id}
              href={`/products/${product.id}`}
              className="border-border hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                    unoptimized
                  />
                ) : (
                  <BellIcon className="text-muted-foreground h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-muted-foreground text-xs">{priceDetail}</p>
              </div>
              <BellIcon className="size-4 shrink-0 text-amber-500" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ProfilePageSkeleton() {
  return (
    <div className="flex grow flex-col gap-6 pb-6 md:flex-row">
      {/* Sidebar skeleton: desktop */}
      <div className="hidden shrink-0 flex-col items-center md:flex md:w-64">
        <Skeleton className="mx-auto mb-4 h-32 w-32 rounded-full" />
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="mb-3 h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
        <Skeleton className="mt-4 h-16 w-full rounded-md" />
      </div>

      {/* Sidebar skeleton: mobile */}
      <div className="flex items-center gap-4 border-b pb-4 md:hidden">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="min-w-0 flex-1">
        <div className="bg-muted inline-flex h-10 items-center gap-1 rounded-md p-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="mt-4 space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
