import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { AppleIcon, ShoppingBasketIcon, TicketPercentIcon, TrendingDownIcon } from "lucide-react"

const entryPoints = [
  { key: "browseAll", href: "/products", icon: ShoppingBasketIcon },
  { key: "priceDrops", href: "/products?sort=price-drop-smart", icon: TrendingDownIcon },
  { key: "bestDiscounts", href: "/products?discounted=true&sort=best-discount", icon: TicketPercentIcon },
  { key: "essential", href: "/products?priority=4,5", icon: AppleIcon },
] as const

/** Same four ways in, on every width. Descriptions stay visible so the link says where it goes. */
export async function EntryPointGrid() {
  const t = await getTranslations("home.entryPoints")

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {entryPoints.map((entry) => (
        <Link
          key={entry.key}
          href={entry.href}
          className="bg-card hover:bg-accent border-border active:bg-accent flex min-h-14 items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors"
        >
          <entry.icon className="text-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm leading-tight font-semibold tracking-tight">{t(`${entry.key}.label`)}</span>
            <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
              {t(`${entry.key}.description`)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}
