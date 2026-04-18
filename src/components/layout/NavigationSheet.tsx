"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { GithubIcon, InstagramIcon, LinkedinIcon, XTwitterIcon } from "@/components/icons"
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
import { navigation, siteConfig, type NavigationItem } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

import { LogoLink } from "@/components/layout/LogoLink"
import { LanguageToggle } from "@/components/layout/LanguageToggle"
import { useNavigationSheet } from "@/contexts/NavigationSheetContext"

const primaryNavKeys = new Set(["/", "/products", "/deals", "/favorites"])

const productQuickFilters = [
  { key: "priceDrops", href: "/products?sort=price-drop-smart", icon: TrendingDownIcon },
  { key: "discounts", href: "/products?discounted=true&sort=best-discount", icon: TicketPercentIcon },
  { key: "essential", href: "/products?priority=5", icon: AppleIcon },
] as const

type NavigationSheetProps = {
  onRequestSearch?: () => void
  onRequestBarcodeScan?: () => void
}

export function NavigationSheet({ onRequestSearch, onRequestBarcodeScan }: NavigationSheetProps = {}) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { user, isLoading } = useUser()
  const { isOpen, setOpen: setIsOpen } = useNavigationSheet()
  const [mounted, setMounted] = useState(false)
  const tNav = useTranslations("nav")
  const tSheet = useTranslations("layout.navSheet")
  const tCommon = useTranslations("common")

  const showMobileHamburgerTrigger = isLoading || !user

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileImage = user?.user_metadata.avatar_url
  const isDark = resolvedTheme === "dark"

  function handleClose() {
    setIsOpen(false)
  }

  const shownNav = navigation.filter((item) => item.shownOnMobile)
  const primaryNav = shownNav.filter((item) => primaryNavKeys.has(item.href))
  const secondaryNav = shownNav.filter((item) => !primaryNavKeys.has(item.href))

  return (
    <Drawer direction="left" open={isOpen} onOpenChange={setIsOpen}>
      {showMobileHamburgerTrigger ? (
        <DrawerTrigger className="inline-flex lg:hidden" asChild>
          <button
            type="button"
            className="hover:bg-accent/60 flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors active:scale-[0.95]"
            aria-label={tSheet("openMenu")}
          >
            <MenuIcon className="size-5" />
          </button>
        </DrawerTrigger>
      ) : null}

      <DrawerContent direction="left" className="flex flex-col gap-0 px-0 pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <DrawerTitle className="sr-only">{tSheet("title")}</DrawerTitle>
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
              <AvatarImage src={profileImage} alt={user?.user_metadata.full_name ?? ""} />
              <AvatarFallback className="text-xs">
                {user?.user_metadata.full_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm leading-tight font-medium">
                {user?.user_metadata.full_name ?? tCommon("labels.profile")}
              </span>
              <span className="text-muted-foreground text-xs leading-tight">{user.email}</span>
            </div>
          </Link>
        ) : (
          <div className="mt-3 px-5">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login" onClick={handleClose}>
                <GoogleIcon />
                {tSheet("signInWithGoogle")}
              </Link>
            </Button>
          </div>
        )}

        {/* quick actions */}
        <div className="mt-3 flex w-full items-center gap-2 px-5">
          <button
            type="button"
            onClick={() => {
              handleClose()
              onRequestSearch?.()
            }}
            className="text-muted-foreground hover:border-input hover:text-foreground border-border flex h-10 w-full flex-1 items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors"
          >
            <SearchIcon className="size-4 shrink-0" />
            <span>{tSheet("searchProducts")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleClose()
              onRequestBarcodeScan?.()
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors"
          >
            <ScanBarcodeIcon className="size-4 shrink-0" />
            <span>{tSheet("scanBarcode")}</span>
          </button>
        </div>

        <Separator className="mx-5 mt-4 w-auto" />

        {/* navigation */}
        <ScrollArea className="flex-1 px-2">
          <nav className="flex flex-col gap-4 py-3">
            <NavSection label={tSheet("sections.navigation")}>
              {primaryNav.map((item) => (
                <div key={item.href}>
                  <NavEntry item={item} isActive={pathname === item.href} onClose={handleClose} label={tNav(item.key)} />
                  {item.href === "/products" && (
                    <div className="ml-2 flex flex-wrap gap-1.5 pt-0.5 pb-2">
                      {productQuickFilters.map((chip) => (
                        <Link
                          key={chip.key}
                          href={chip.href}
                          onClick={handleClose}
                          className="bg-secondary/5 dark:bg-secondary/10 hover:bg-accent flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                        >
                          <chip.icon className="text-muted-foreground size-3" />
                          {tSheet(`quickFilters.${chip.key}`)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </NavSection>

            <NavSection label={tSheet("sections.more")}>
              {secondaryNav.map((item) => (
                <NavEntry
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  onClose={handleClose}
                  label={tNav(item.key)}
                />
              ))}
            </NavSection>

            <NavSection label={tSheet("sections.preferences")}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setTheme(isDark ? "light" : "dark")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setTheme(isDark ? "light" : "dark")
                  }
                }}
                className="hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors"
              >
                <ContrastIcon className="text-muted-foreground size-4 shrink-0 dark:rotate-180" />
                <span>{tSheet("darkMode")}</span>
                {mounted && (
                  <Switch checked={isDark} className="pointer-events-none ml-auto" tabIndex={-1} aria-hidden />
                )}
              </div>
              <div className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm">
                <span>{tCommon("labels.language")}</span>
                <LanguageToggle variant="compact" className="ml-auto" />
              </div>
            </NavSection>
          </nav>
        </ScrollArea>

        <Separator className="mx-5 w-auto" />

        {/* footer */}
        <div className="flex items-center justify-between px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] [@media(display-mode:standalone)]:pb-4">
          <div className="flex flex-col gap-0.5">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              {tSheet.rich("builtBy", { name: (chunks) => <span className="font-medium">{chunks}</span> })}
            </Link>
            <Link
              href={siteConfig.links.repo}
              target="_blank"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
            >
              <GithubIcon className="size-3" />
              <span>{tSheet("openSource")}</span>
            </Link>
          </div>

          <div className="flex items-center gap-0.5">
            <Link
              href={siteConfig.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="size-3.5 fill-current" />
            </Link>
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
              aria-label="X (Twitter)"
            >
              <XTwitterIcon className="size-3.5 fill-current" />
            </Link>
            <Link
              href={siteConfig.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="size-3.5 fill-current stroke-transparent" />
            </Link>
          </div>
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

function NavEntry({
  item,
  isActive,
  onClose,
  label,
}: {
  item: NavigationItem
  isActive: boolean
  onClose: () => void
  label: string
}) {
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
      <span>{label}</span>
    </Link>
  )
}
