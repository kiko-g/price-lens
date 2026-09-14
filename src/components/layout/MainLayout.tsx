"use client"

import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { Header } from "./Header"
import { AppSidebar } from "./AppSidebar"
import { BottomNav } from "./BottomNav"
import { ControlledFooter } from "./ControlledFooter"
import { ScrollToTop } from "./ScrollToTop"
import { WelcomeToast } from "./WelcomeToast"

type MainLayoutProps = {
  children: React.ReactNode
  /** Persisted desktop sidebar state, read from the cookie in the root layout. */
  sidebarDefaultCollapsed?: boolean
}

/**
 * App shell: desktop (lg+) gets a sticky sidebar + slim header; mobile keeps the header,
 * bottom nav and navigation sheet. Admin routes render their own shell.
 */
export function MainLayout({ children, sidebarDefaultCollapsed = false }: MainLayoutProps) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) return <>{children}</>

  return (
    <div className="flex min-h-screen w-full">
      <ScrollToTop />
      <Suspense>
        <WelcomeToast />
      </Suspense>
      <AppSidebar defaultCollapsed={sidebarDefaultCollapsed} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />
        <div className="flex flex-1 flex-col pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0 [@media(display-mode:standalone)]:pb-25">
          {children}
        </div>
        <ControlledFooter />
      </div>
      <BottomNav />
    </div>
  )
}
