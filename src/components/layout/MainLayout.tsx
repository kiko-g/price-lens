"use client"

import { usePathname } from "next/navigation"
import { BarcodeScanButton } from "@/components/scan"
import { Header } from "./Header"
import { ControlledFooter } from "./ControlledFooter"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <ControlledFooter />
      <div className="fixed bottom-7 left-5 z-50 flex flex-col items-end gap-3 md:bottom-10 md:left-8">
        <BarcodeScanButton />
      </div>
    </div>
  )
}
