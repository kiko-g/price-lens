"use client"

import { useUser } from "@/hooks/useUser"
import { PersonalizedDashboard } from "@/components/home/PersonalizedDashboard"
import { PersonalizedDashboardSkeleton } from "@/components/home/PersonalizedDashboardSkeleton"
import type { HeroProduct } from "@/lib/business/hero"

interface HomeContentProps {
  totalProducts: number
  marketingContent: React.ReactNode
  heroProducts: HeroProduct[]
}

export function HomeContent({ totalProducts, marketingContent, heroProducts }: HomeContentProps) {
  const { user, isLoading } = useUser()

  if (isLoading) return <PersonalizedDashboardSkeleton />

  if (user) {
    return <PersonalizedDashboard totalProducts={totalProducts} heroProducts={heroProducts} />
  }

  return <>{marketingContent}</>
}
