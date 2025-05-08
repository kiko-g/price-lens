"use client"

import { Header } from "./Header"
import { Footer } from "./Footer"

export function Layout({
  children,
  options,
}: {
  children: React.ReactNode
  options?: { hideHeader?: boolean; hideFooter?: boolean }
}) {
  return (
    <>
      {!options?.hideHeader && <Header />}
      <main className="flex flex-1">{children}</main>
      {!options?.hideFooter && <Footer />}
    </>
  )
}
