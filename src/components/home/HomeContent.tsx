"use client"

import { useUser } from "@/hooks/useUser"
import { PersonalizedDashboard } from "@/components/home/PersonalizedDashboard"

interface HomeContentProps {
  totalProducts: number
  marketingContent: React.ReactNode
}

export function HomeContent({ totalProducts, marketingContent }: HomeContentProps) {
  const { user, isLoading } = useUser()

  if (isLoading) return null

  if (user) {
    return <PersonalizedDashboard totalProducts={totalProducts} />
  }

  return <>{marketingContent}</>
}
