"use client"

import { useUser } from "@/hooks/useUser"
import { PersonalizedDashboard } from "@/components/home/PersonalizedDashboard"
import { PersonalizedDashboardSkeleton } from "@/components/home/PersonalizedDashboardSkeleton"

interface HomeContentProps {
  totalProducts: number
  marketingContent: React.ReactNode
}

export function HomeContent({ totalProducts, marketingContent }: HomeContentProps) {
  const { user, isLoading } = useUser()

  if (isLoading) return <PersonalizedDashboardSkeleton />

  if (user) {
    return <PersonalizedDashboard totalProducts={totalProducts} />
  }

  return <>{marketingContent}</>
}
