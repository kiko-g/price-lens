"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useMediaQuery } from "@/hooks/useMediaQuery"

import { Kbd } from "@/components/ui/kbd"

import { LogoLink } from "@/components/layout/LogoLink"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { NavigationSheet } from "@/components/layout/NavigationSheet"
import { SearchContainer } from "@/components/layout/search"
import { UserDropdownMenu } from "@/components/layout/UserDropdownMenu"
import { BarcodeScanButton } from "@/components/scan"
import { FavoritesLink } from "@/components/layout/FavoritesLink"
import { EarlyAccessBadge } from "@/components/layout/EarlyAccessBadge"
import { NavigationSheetProvider } from "@/contexts/NavigationSheetContext"

import { SearchIcon } from "lucide-react"

export function Header() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isEarlyAccess = false
  const [navSheetSearchOpen, setNavSheetSearchOpen] = useState(false)
  const [navSheetScanOpen, setNavSheetScanOpen] = useState(false)
  const tHeader = useTranslations("layout.header")

  return (
    <NavigationSheetProvider>
      <header className="bg-background/90 sticky top-0 z-50 mx-auto h-(--header-height) w-full border-b pt-[env(safe-area-inset-top,0px)] backdrop-blur backdrop-filter xl:px-4">
        <div className="flex h-full min-w-0 items-center justify-between gap-2 px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <NavigationSheet
              onRequestSearch={() => setNavSheetSearchOpen(true)}
              onRequestBarcodeScan={() => setNavSheetScanOpen(true)}
            />

            <SearchContainer
              open={navSheetSearchOpen}
              onOpenChange={setNavSheetSearchOpen}
              registerKeyboardShortcut={false}
            >
              <button type="button" tabIndex={-1} className="sr-only" aria-hidden>
                {tHeader("openSearchFromMenu")}
              </button>
            </SearchContainer>
            <BarcodeScanButton open={navSheetScanOpen} onOpenChange={setNavSheetScanOpen}>
              <button type="button" tabIndex={-1} className="sr-only" aria-hidden>
                {tHeader("openBarcodeFromMenu")}
              </button>
            </BarcodeScanButton>

            {/* On lg+ the sidebar owns the logo and primary navigation. */}
            <LogoLink className="lg:hidden" />
            {isEarlyAccess && <EarlyAccessBadge />}
          </div>

          <div className="flex shrink-0 items-center justify-center gap-2.5 md:gap-3">
            <div className="hidden md:flex lg:hidden">
              <ThemeToggle size="icon" variant="outline" />
            </div>

            <FavoritesLink />

            {!isMobile && (
              <SearchContainer>
                <button
                  type="button"
                  className="text-muted-foreground hover:border-primary/50 hover:text-foreground border-border bg-card hidden h-[34px] max-w-[320px] min-w-[240px] cursor-pointer items-center gap-2 border px-3 py-2 transition-colors md:flex"
                >
                  <SearchIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-left text-sm">{tHeader("searchProducts")}</span>
                  {/* eslint-disable-next-line @formatjs/no-literal-string-in-jsx -- keyboard shortcut symbol */}
                  <Kbd className="bg-muted dark:bg-foreground/10 h-5 min-w-5 rounded-none px-1.5 text-[10px]">⌘K</Kbd>
                </button>
              </SearchContainer>
            )}

            <UserDropdownMenu />
          </div>
        </div>
      </header>
    </NavigationSheetProvider>
  )
}
