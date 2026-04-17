import { SupermarketChain } from "@/types/business"
import { TrendingDownIcon, TicketPercentIcon, type LucideIcon } from "lucide-react"

/** Priority 5 = Essential (see `PRIORITY_CONFIG` in `@/lib/business/priority`). */
const ESSENTIAL_PRIORITIES = [5, 4]

/**
 * Browse one chain’s tracked essentials sorted cheapest-first (resets other filters via a fresh query).
 */
export function browseEssentialCheapestProductsHref(originId: SupermarketChain): string {
  const params = new URLSearchParams({
    origin: String(originId),
    priority: ESSENTIAL_PRIORITIES.join(","),
    sort: "price-low-high",
  })
  return `/products?${params.toString()}`
}

export type BrowseQuickPreset = {
  /** Drawer, desktop row, and accessible name */
  label: string
  /** Tighter copy for narrow grids (e.g. home 2-col mobile); full `label` should be exposed via `title` / aria */
  shortLabel: string
  description: string
  href: string
  icon: LucideIcon
}

/**
 * Short, concrete browse entry points (mobile drawer chips, home row, etc.).
 * Prefer store + intent over generic “deals” jargon.
 */
export const BROWSE_QUICK_PRESETS: readonly BrowseQuickPreset[] = [
  {
    label: "Quedas no Continente",
    shortLabel: "Quedas · Continente",
    description: "Onde o preço baixou vs histórico",
    href: `/products?origin=${SupermarketChain.Continente}&sort=price-drop-smart`,
    icon: TrendingDownIcon,
  },
  {
    label: "Quedas no Pingo Doce",
    shortLabel: "Quedas · Pingo Doce",
    description: "Onde o preço baixou vs histórico",
    href: `/products?origin=${SupermarketChain.PingoDoce}&sort=price-drop-smart`,
    icon: TrendingDownIcon,
  },
  {
    label: "Melhores promoções",
    shortLabel: "Melhores promoções",
    description: "Maiores descontos em todas as lojas",
    href: "/products?discounted=true&sort=best-discount",
    icon: TicketPercentIcon,
  },
]
