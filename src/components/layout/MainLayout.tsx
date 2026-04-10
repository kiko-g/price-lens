"use client"

import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { ControlledFooter } from "./ControlledFooter"
import { ScrollToTop } from "./ScrollToTop"
import { WelcomeToast } from "./WelcomeToast"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Suspense>
        <WelcomeToast />
      </Suspense>
      <Header />
      <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">{children}</div>
      <ControlledFooter />
      <BottomNav />
    </div>
  )
}
