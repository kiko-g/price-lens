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
  { href: "/products", label: "Products", icon: ShoppingBasketIcon },
  { href: "__scan__", label: "Scan", icon: ScanBarcodeIcon },
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
        "bg-background/95 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-lg transition-transform duration-300 lg:hidden",
        "pb-[env(safe-area-inset-bottom,0px)]",
        isHidden && "translate-y-full",
      )}
    >
      <div className="flex h-14 items-center justify-around px-2">
        {navItems.map((item) => {
          if (item.href === "__scan__") {
            return (
              <BarcodeScanButton key={item.label}>
                <button
                  type="button"
                  className="bg-primary text-primary-foreground -mt-4 flex size-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
                  aria-label="Scan barcode"
                >
                  <item.icon className="size-5" />
                </button>
              </BarcodeScanButton>
            )
          }

          const isActive =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/")

          const resolvedHref = item.href === "/profile" && !user ? "/login" : item.href

          return (
            <Link
              key={item.label}
              href={resolvedHref}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-label={item.label}
            >
              <item.icon className={cn("size-5", isActive && "fill-primary/15")} />
              <span className="text-[10px] leading-tight font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
