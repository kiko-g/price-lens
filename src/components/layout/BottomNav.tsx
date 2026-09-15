"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { useUser } from "@/hooks/useUser"

import {
  GlyphExplore,
  GlyphFavorites,
  GlyphHome,
  GlyphProfile,
  GlyphScan,
  GlyphSearch,
} from "@/components/icons/lince-glyphs"
import { BarcodeScanButton } from "@/components/scan"
import { SearchContainer } from "@/components/layout/search"

const navItems = [
  { href: "/", key: "home", icon: GlyphHome },
  { href: "/products", key: "browse", icon: GlyphExplore },
  { href: "/favorites", key: "favorites", icon: GlyphFavorites },
  { href: "/profile", key: "profile", icon: GlyphProfile },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const scrollDirection = useScrollDirection({ threshold: 20, minScrollY: 100 })
  const { user } = useUser()
  const tNav = useTranslations("nav")
  const tBottom = useTranslations("layout.bottomNav")
  const tHeader = useTranslations("layout.header")

  const isHidden = scrollDirection === "down"

  return (
    <nav
      className={cn(
        "bg-background border-border/40 fixed right-0 bottom-0 left-0 z-50 border-t shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out lg:hidden dark:shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.35)]",
        /* PWA standalone: skip stacking full safe-area — browser tab keeps env() for home indicator */
        "px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] [@media(display-mode:standalone)]:pb-3",
        isHidden && "translate-y-full",
      )}
      aria-label={tBottom("primary")}
    >
      <div className="flex items-center gap-2">
        <div className="bg-card text-card-foreground border-border hud-cut-sm flex min-w-0 flex-1 items-center justify-around border px-1 py-1 shadow-sm sm:px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/")

            const resolvedHref = item.href === "/profile" && !user ? "/login" : item.href

            const label = tNav(item.key)
            return (
              <Link
                key={item.key}
                href={resolvedHref}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1 transition-all duration-200 sm:px-2.5",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
                aria-label={label}
              >
                {isActive && <span aria-hidden className="bg-primary ember-glow absolute -top-1.5 h-0.5 w-6" />}
                <item.icon className={cn("size-5 shrink-0", isActive && "text-primary")} />
                <span className="text-[10px] leading-tight font-medium max-[380px]:hidden">{label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SearchContainer registerKeyboardShortcut={false}>
            <button
              type="button"
              className="border-border bg-card text-card-foreground hover:bg-accent hud-cut-sm flex size-12 items-center justify-center border shadow-sm transition-transform active:scale-95"
              aria-label={tHeader("searchProducts")}
            >
              <GlyphSearch className="size-5" />
            </button>
          </SearchContainer>
          <BarcodeScanButton>
            <button
              type="button"
              className="bg-primary text-primary-foreground ember-glow hud-cut-sm flex size-12 items-center justify-center shadow-sm transition-transform active:scale-95"
              aria-label={tBottom("scan")}
            >
              <GlyphScan className="size-5" />
            </button>
          </BarcodeScanButton>
        </div>
      </div>
    </nav>
  )
}
