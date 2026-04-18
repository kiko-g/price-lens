import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { BadgeEuroIcon, HeartIcon, ShoppingBasketIcon, TrendingDownIcon } from "lucide-react"

const actions = [
  { key: "allProducts", href: "/products", icon: ShoppingBasketIcon },
  { key: "tracked", href: "/products?priority=2,3,4,5", icon: BadgeEuroIcon },
  { key: "priceDrops", href: "/products?sort=price-drop-smart&available=true", icon: TrendingDownIcon },
  { key: "favorites", href: "/favorites", icon: HeartIcon },
] as const

export async function QuickActions() {
  const t = await getTranslations("home.quickActions")
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className="bg-card hover:bg-accent flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        >
          <action.icon className="text-primary size-4" />
          {t(action.key)}
        </Link>
      ))}
    </div>
  )
}
