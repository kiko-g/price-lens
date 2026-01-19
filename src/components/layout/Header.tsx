"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { navigation } from "@/lib/config"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

import { LogoLink } from "@/components/layout/LogoLink"
import { NavigationMenu } from "@/components/layout/NavigationMenu"
import { SearchDialog } from "@/components/layout/SearchDialog"
import { UserDropdownMenu } from "@/components/layout/UserDropdownMenu"
import { EarlyAccessBadge } from "@/components/layout/EarlyAccessBadge"

import { SearchIcon } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <header className="bg-opacity-80 dark:bg-opacity-80 bg-background/90 sticky top-0 z-50 mx-auto h-[54px] w-full border-b backdrop-blur backdrop-filter xl:px-4">
      <div className="flex h-full items-center justify-between px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
        <div className="flex items-center gap-3">
          <LogoLink />
          <EarlyAccessBadge />

          <nav className="ml-3 hidden items-center gap-1.5 md:flex">
            {navigation
              .filter((item) => item.shown)
              .map((item) => {
                const hrefSanitized = item.href.split("?")[0]
                return (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn("", pathname === hrefSanitized && "bg-zinc-200 dark:bg-zinc-100/20")}
                    key={item.href}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                )
              })}
          </nav>
        </div>

        <div className="flex items-center justify-center gap-2.5 md:gap-3">
          {!isMobile && (
            <SearchDialog>
              <Button variant="outline" size="icon" className="relative hidden bg-transparent md:inline-flex">
                <SearchIcon className="h-4 w-4" />
              </Button>
            </SearchDialog>
          )}
          <UserDropdownMenu />
          <NavigationMenu />
        </div>
      </div>
    </header>
  )
}
