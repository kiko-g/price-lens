import Link from "next/link"
import { BadgeEuroIcon, HeartIcon, ShoppingBasketIcon, TrendingDownIcon } from "lucide-react"

const actions = [
  {
    label: "All Products",
    href: "/products",
    icon: ShoppingBasketIcon,
  },
  {
    label: "Tracked",
    href: "/products?priority=2,3,4,5",
    icon: BadgeEuroIcon,
  },
  {
    label: "Price Drops",
    href: "/products?sort=price-drop-smart&available=true",
    icon: TrendingDownIcon,
  },
  {
    label: "Favorites",
    href: "/favorites",
    icon: HeartIcon,
  },
]

export function QuickActions() {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="bg-card hover:bg-accent flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        >
          <action.icon className="text-primary size-4" />
          {action.label}
        </Link>
      ))}
    </div>
  )
}
