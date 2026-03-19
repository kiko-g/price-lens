"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { NavigationItem } from "@/types"
import { GithubIcon } from "@/components/icons"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import {
  ContrastIcon,
  MenuIcon,
  ScanBarcodeIcon,
  SearchIcon,
  TrendingDownIcon,
  TicketPercentIcon,
  AppleIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { navigation, siteConfig } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

import { LogoLink } from "@/components/layout/LogoLink"
import { SearchContainer } from "@/components/layout/search"
import { BarcodeScanButton } from "@/components/scan"

const primaryNavKeys = new Set(["/", "/products", "/favorites"])

const productQuickFilters = [
  { label: "Price Drops", href: "/products?sort=price-drop", icon: TrendingDownIcon },
  { label: "Discounts", href: "/products?discounted=true&sort=best-discount", icon: TicketPercentIcon },
  { label: "Essential", href: "/products?priority=5", icon: AppleIcon },
] as const

export function NavigationSheet() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { user, isLoading } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileImage = user?.user_metadata.avatar_url
  const isDark = resolvedTheme === "dark"

  function handleClose() {
    setIsOpen(false)
  }

  const shownNav = navigation.filter((item) => item.shown)
  const primaryNav = shownNav.filter((item) => primaryNavKeys.has(item.href))
  const secondaryNav = shownNav.filter((item) => !primaryNavKeys.has(item.href))

  return (
    <Drawer direction="left" open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger className="md:hidden" asChild>
        <button
          type="button"
          className="hover:bg-accent/60 flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors active:scale-[0.95]"
        >
          <MenuIcon className="size-5" />
        </button>
      </DrawerTrigger>

      <DrawerContent
        direction="left"
        className="flex flex-col gap-0 px-0 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
      >
        {/* header: logo + profile */}
        <div className="px-5">
          <LogoLink />
        </div>

        {isLoading ? (
          <div className="mt-3 px-5">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : user ? (
          <Link
            href="/profile"
            onClick={handleClose}
            className={cn(
              "hover:bg-accent mx-3 mt-3 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors",
              pathname === "/profile" && "bg-accent",
            )}
          >
            <Avatar className="size-9">
              <AvatarImage src={profileImage} alt={user?.user_metadata.full_name ?? "User"} />
              <AvatarFallback className="text-xs">
                {user?.user_metadata.full_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm leading-tight font-medium">{user?.user_metadata.full_name ?? "Profile"}</span>
              <span className="text-muted-foreground text-xs leading-tight">{user.email}</span>
            </div>
          </Link>
        ) : (
          <div className="mt-3 px-5">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login" onClick={handleClose}>
                <GoogleIcon />
                Sign in with Google
              </Link>
            </Button>
          </div>
        )}

        {/* quick actions */}
        <div className="mt-3 flex w-full items-center gap-2 px-5">
          <SearchContainer registerKeyboardShortcut={false}>
            <button
              type="button"
              className="text-muted-foreground hover:border-input hover:text-foreground border-border flex h-10 w-full flex-1 items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors"
            >
              <SearchIcon className="size-4 shrink-0" />
              <span>Search products...</span>
            </button>
          </SearchContainer>

          <BarcodeScanButton>
            <button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors"
            >
              <ScanBarcodeIcon className="size-4 shrink-0" />
              <span>Scan barcode</span>
            </button>
          </BarcodeScanButton>
        </div>

        <Separator className="mx-5 mt-4 w-auto" />

        {/* navigation */}
        <ScrollArea className="flex-1 px-2">
          <nav className="flex flex-col gap-4 py-3">
            <NavSection label="Navigation">
              {primaryNav.map((item) => (
                <div key={item.href}>
                  <NavEntry item={item} isActive={pathname === item.href} onClose={handleClose} />
                  {item.href === "/products" && (
                    <div className="ml-2 flex flex-wrap gap-1.5 pt-0.5 pb-2">
                      {productQuickFilters.map((chip) => (
                        <Link
                          key={chip.label}
                          href={chip.href}
                          onClick={handleClose}
                          className="bg-secondary/5 dark:bg-secondary/10 hover:bg-accent flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                        >
                          <chip.icon className="text-muted-foreground size-3" />
                          {chip.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </NavSection>

            <NavSection label="More">
              {secondaryNav.map((item) => (
                <NavEntry key={item.href} item={item} isActive={pathname === item.href} onClose={handleClose} />
              ))}
            </NavSection>

            <NavSection label="Preferences">
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors"
              >
                <ContrastIcon className="text-muted-foreground size-4 shrink-0 dark:rotate-180" />
                <span>Dark mode</span>
                {mounted && (
                  <Switch checked={isDark} className="pointer-events-none ml-auto" tabIndex={-1} aria-hidden />
                )}
              </button>
            </NavSection>
          </nav>
        </ScrollArea>

        <Separator className="mx-5 w-auto" />

        {/* footer */}
        <div className="flex items-center px-5 pt-3">
          <Link
            href={siteConfig.links.repo}
            target="_blank"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-1 py-1 text-xs transition-colors"
          >
            <GithubIcon className="size-3.5" />
            <span>Source code</span>
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground mb-1 block px-3 text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function NavEntry({ item, isActive, onClose }: { item: NavigationItem; isActive: boolean; onClose: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
        isActive ? "bg-accent font-medium" : "text-foreground hover:bg-accent/60",
      )}
    >
      {item.icon && (
        <item.icon className={cn("size-4 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
      )}
      <span>{item.label}</span>
    </Link>
  )
}
