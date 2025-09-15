"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { navigation } from "@/lib/config"
import { usePathname } from "next/navigation"

import { FavoritesLink } from "@/components/layout/FavoritesLink"
import { LogoLink } from "@/components/layout/LogoLink"
import { NavigationMenu } from "@/components/layout/NavigationMenu"
import { SearchDialog } from "@/components/layout/SearchDialog"
import { UserDropdownMenu } from "@/components/layout/UserDropdownMenu"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <header className="bg-opacity-95 dark:bg-opacity-95 sticky top-0 z-50 mx-auto h-[54px] w-full border-b bg-zinc-50 backdrop-blur backdrop-filter xl:px-4 dark:bg-zinc-950">
      <div className="flex h-full items-center justify-between px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
        <div className="flex items-center gap-3">
          <LogoLink />
          <span className="text-2xs/4 inline-flex items-center rounded-full bg-linear-to-br from-orange-500/70 to-rose-600/70 px-1 py-1 text-center leading-tight font-bold tracking-tighter text-white capitalize md:px-1.5 md:py-0.5 md:text-xs/4 md:font-semibold dark:from-purple-400 dark:to-indigo-500">
            Early Access
          </span>

          <nav className="ml-3 hidden items-center gap-1.5 md:flex">
            {navigation
              .filter((item) => item.shown)
              .map((item) => (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn("", pathname === item.href && "bg-zinc-200 dark:bg-zinc-100/20")}
                  key={item.href}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
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
