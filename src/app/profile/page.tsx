"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/useUser"

import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { ProfileSidebar } from "@/components/profile/ProfileSidebar"
import { FavoritesTab } from "@/components/profile/FavoritesTab"
import { ListsTab } from "@/components/profile/ListsTab"
import { PlanTab } from "@/components/profile/PlanTab"
import { SettingsTab } from "@/components/profile/SettingsTab"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BellIcon, CreditCardIcon, HeartIcon, ListIcon, SettingsIcon } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading } = useUser()

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
                    <span className="hidden sm:inline">Favorites</span>
                  </TabsTrigger>
                  <TabsTrigger value="lists" className="gap-1.5">
                    <ListIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lists</span>
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="gap-1.5">
                    <BellIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Alerts</span>
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="gap-1.5">
                    <CreditCardIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Plan</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5">
                    <SettingsIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Settings</span>
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
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <BellIcon className="text-muted-foreground mb-4 h-10 w-10" />
      <h3 className="text-lg font-semibold">Price alerts</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Get notified when products you track drop in price. Available with Price Lens Plus.
      </p>
      <Button variant="outline" size="sm" className="mt-4" disabled>
        Coming Soon
      </Button>
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
