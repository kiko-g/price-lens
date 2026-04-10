"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { useUser } from "@/hooks/useUser"

import { HomeIcon, ShoppingBasketIcon, ScanBarcodeIcon, HeartIcon, UserIcon } from "lucide-react"
import { BarcodeScanButton } from "@/components/scan"

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
        "fixed right-0 bottom-0 left-0 z-50 flex items-center px-4 transition-transform duration-300 lg:hidden",
        "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
        isHidden && "translate-y-full",
      )}
    >
      <div className="bg-background/80 flex h-14 flex-1 items-center justify-around rounded-full border border-border/50 px-2 shadow-md backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/")

          const resolvedHref = item.href === "/profile" && !user ? "/login" : item.href

          return (
            <Link
              key={item.label}
              href={resolvedHref}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1.5 transition-all duration-200",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
              aria-label={item.label}
            >
              <item.icon className={cn("size-5", isActive && "fill-foreground/10")} />
              <span className="text-[10px] leading-tight font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <BarcodeScanButton>
        <button
          type="button"
          className="bg-foreground text-background ml-3 flex size-14 shrink-0 items-center justify-center rounded-full shadow-md transition-transform active:scale-95"
          aria-label="Scan barcode"
        >
          <ScanBarcodeIcon className="size-6" />
        </button>
      </BarcodeScanButton>
    </nav>
  )
}
