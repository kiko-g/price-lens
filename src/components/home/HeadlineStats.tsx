import Link from "next/link"
import { PackageIcon, TrendingDownIcon, TagIcon } from "lucide-react"
import type { HomeStats } from "@/lib/queries/home-stats"

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`
  return String(n)
}

type StatItem = {
  icon: typeof PackageIcon
  value: string
  label: string
  href?: string
  accent?: boolean
}

function buildStats(stats: HomeStats): StatItem[] {
  return [
    {
      icon: PackageIcon,
      value: formatNumber(stats.totalProducts),
      label: "products tracked",
      href: "/products",
    },
    {
      icon: TrendingDownIcon,
      value: String(stats.priceDropsToday),
      label: "price drops today",
      href: "/products?sort=discount&available=true",
      accent: stats.priceDropsToday > 0,
    },
    {
      icon: TagIcon,
      value: String(stats.productsOnDiscount),
      label: "on discount now",
      href: "/products?sort=discount&available=true",
      accent: stats.productsOnDiscount > 0,
    },
  ]
}

export function HeadlineStats({ stats }: { stats: HomeStats }) {
  const items = buildStats(stats)

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:justify-start [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const content = (
          <div className="bg-card hover:bg-accent flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2 transition-colors">
            <item.icon
              className={`size-4 shrink-0 ${item.accent ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tabular-nums">{item.value}</span>
              <span className="text-muted-foreground text-xs">{item.label}</span>
            </div>
          </div>
        )

        if (item.href) {
          return (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          )
        }

        return <div key={item.label}>{content}</div>
      })}
    </div>
  )
}
