"use client"

import { usePathname } from "next/navigation"
import { Header } from "./Header"
import { ControlledFooter } from "./ControlledFooter"
import { ScrollToTop } from "./ScrollToTop"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <ScrollToTop />
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <ControlledFooter />
    </div>
  )
}
