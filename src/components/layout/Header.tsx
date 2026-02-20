"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { navigation } from "@/lib/config"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"

import { LogoLink } from "@/components/layout/LogoLink"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { NavigationMenu } from "@/components/layout/NavigationMenu"
import { SearchContainer } from "@/components/layout/search"
import { UserDropdownMenu } from "@/components/layout/UserDropdownMenu"
import { EarlyAccessBadge } from "@/components/layout/EarlyAccessBadge"

import { SearchIcon } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isEarlyAccess = false

  return (
    <header className="bg-opacity-80 dark:bg-opacity-80 bg-background/90 sticky top-0 z-50 mx-auto h-(--header-height) w-full border-b pt-[env(safe-area-inset-top,0px)] backdrop-blur backdrop-filter xl:px-4">
      <div className="flex h-full items-center justify-between px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
        <div className="flex items-center gap-3">
          <LogoLink />
          {isEarlyAccess && <EarlyAccessBadge />}

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
            <SearchContainer>
              <div className="text-muted-foreground hover:border-input hover:text-foreground border-border bg-accent hidden h-[34px] max-w-[280px] min-w-[200px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors md:flex">
                <SearchIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-sm">Search products</span>
                <Kbd className="bg-muted dark:bg-primary/20 h-5 min-w-5 px-1.5 text-[10px]">⌘K</Kbd>
              </div>
            </SearchContainer>
          )}

          <ThemeToggle size="icon" variant="outline" />
          <NavigationMenu />

          <Separator orientation="vertical" className="h-6" />

          <UserDropdownMenu />
        </div>
      </div>
    </header>
  )
}
