"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { useUser } from "@/hooks/useUser"

import { HomeIcon, ShoppingBasketIcon, ScanBarcodeIcon, HeartIcon, UserIcon, SearchIcon } from "lucide-react"
import { BarcodeScanButton } from "@/components/scan"
import { SearchContainer } from "@/components/layout/search"

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/products", label: "Browse", icon: ShoppingBasketIcon },
  { href: "/favorites", label: "Favorites", icon: HeartIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const scrollDirection = useScrollDirection({ threshold: 20, minScrollY: 100 })
  const { user } = useUser()

  const isHidden = scrollDirection === "down"

  return (
    <nav
      className={cn(
        "bg-background border-border/40 fixed right-0 bottom-0 left-0 z-50 border-t shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out lg:hidden dark:shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.35)]",
        "px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]",
        isHidden && "translate-y-full",
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-center gap-2">
        <div className="bg-card text-card-foreground border-border flex min-w-0 flex-1 items-center justify-around rounded-full border px-1 py-1 shadow-sm sm:px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/")

            const resolvedHref = item.href === "/profile" && !user ? "/login" : item.href

            return (
              <Link
                key={item.label}
                href={resolvedHref}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 transition-all duration-200 sm:px-2.5",
                  isActive ? "bg-accent text-foreground" : "text-accent-foreground",
                )}
                aria-label={item.label}
              >
                <item.icon className={cn("size-5 shrink-0", isActive && "fill-foreground/10")} />
                <span className="text-[10px] leading-tight font-medium max-[380px]:hidden">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SearchContainer registerKeyboardShortcut={false}>
            <button
              type="button"
              className="border-border bg-card text-card-foreground hover:bg-accent flex size-12 items-center justify-center rounded-full border shadow-sm transition-transform active:scale-95"
              aria-label="Search products"
            >
              <SearchIcon className="size-5" />
            </button>
          </SearchContainer>
          <BarcodeScanButton>
            <button
              type="button"
              className="bg-foreground text-background flex size-12 items-center justify-center rounded-full shadow-sm transition-transform active:scale-95"
              aria-label="Scan barcode"
            >
              <ScanBarcodeIcon className="size-5" />
            </button>
          </BarcodeScanButton>
        </div>
      </div>
    </nav>
  )
}
