"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export function ScrollToTop() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname

    window.scrollTo(0, 0)

    document.querySelectorAll("[data-main-scroll]").forEach((el) => {
      ;(el as HTMLElement).scrollTop = 0
    })
  }, [pathname])

  return null
}
