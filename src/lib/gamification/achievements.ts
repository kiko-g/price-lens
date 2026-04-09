import {
  HeartIcon,
  BellIcon,
  ScanBarcodeIcon,
  SearchIcon,
  TagIcon,
  ScaleIcon,
  SparklesIcon,
  FlameIcon,
} from "lucide-react"

export interface AchievementDef {
  key: string
  title: string
  description: string
  icon: React.ElementType
  category: "exploration" | "engagement" | "savings"
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_favorite",
    title: "Heart Collector",
    description: "Favorited your first product",
    icon: HeartIcon,
    category: "engagement",
  },
  {
    key: "five_favorites",
    title: "Curated Shelf",
    description: "Favorited 5 products",
    icon: HeartIcon,
    category: "engagement",
  },
  {
    key: "first_alert",
    title: "Price Watcher",
    description: "Set your first price alert",
    icon: BellIcon,
    category: "savings",
  },
  {
    key: "first_scan",
    title: "Scanner",
    description: "Scanned your first barcode",
    icon: ScanBarcodeIcon,
    category: "exploration",
  },
  {
    key: "ten_searches",
    title: "Researcher",
    description: "Searched for 10 products",
    icon: SearchIcon,
    category: "exploration",
  },
  {
    key: "first_compare",
    title: "Price Comparator",
    description: "Compared prices across stores",
    icon: ScaleIcon,
    category: "savings",
  },
  {
    key: "deal_hunter",
    title: "Deal Hunter",
    description: "Visited the deals page",
    icon: TagIcon,
    category: "savings",
  },
  {
    key: "streak_3",
    title: "Consistent Saver",
    description: "Checked prices 3 days in a row",
    icon: FlameIcon,
    category: "engagement",
  },
  {
    key: "streak_7",
    title: "Dedicated Tracker",
    description: "Checked prices 7 days in a row",
    icon: FlameIcon,
    category: "engagement",
  },
  {
    key: "first_list",
    title: "List Maker",
    description: "Created your first shopping list",
    icon: SparklesIcon,
    category: "engagement",
  },
]

export function getAchievement(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key)
}
