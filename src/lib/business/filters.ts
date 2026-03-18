import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpWideNarrowIcon,
  ArrowDownWideNarrowIcon,
  ClockArrowDown,
  ClockArrowUp,
  CalendarArrowDown,
  CalendarArrowUp,
  TrendingDownIcon,
  TrendingUpIcon,
  AppleIcon,
  SquareStarIcon,
  TicketPercentIcon,
} from "lucide-react"

export const UTILITY_SORT_OPTIONS = [
  { label: "Most Relevant", value: "relevance", icon: SquareStarIcon },
  { label: "Name: A to Z", value: "a-z", icon: ArrowDownAZ },
  { label: "Name: Z to A", value: "z-a", icon: ArrowUpAZ },
  { label: "Price: High to Low", value: "price-high-low", icon: ArrowUpWideNarrowIcon },
  { label: "Price: Low to High", value: "price-low-high", icon: ArrowDownWideNarrowIcon },
  { label: "Recently Updated", value: "updated-newest", icon: ClockArrowDown },
  { label: "Least Updated", value: "updated-oldest", icon: ClockArrowUp },
  { label: "Recently Added", value: "created-newest", icon: CalendarArrowDown },
  { label: "Oldest First", value: "created-oldest", icon: CalendarArrowUp },
] as const

export const ALL_SORT_LABELS: Record<string, { label: string; icon: typeof ClockArrowDown }> = {
  relevance: { label: "Most Relevant", icon: SquareStarIcon },
  "updated-newest": { label: "Recently Updated", icon: ClockArrowDown },
  "updated-oldest": { label: "Least Updated", icon: ClockArrowUp },
  "created-newest": { label: "Recently Added", icon: CalendarArrowDown },
  "created-oldest": { label: "Oldest First", icon: CalendarArrowUp },
  "a-z": { label: "Name: A to Z", icon: ArrowDownAZ },
  "z-a": { label: "Name: Z to A", icon: ArrowUpAZ },
  "price-high-low": { label: "Price: High to Low", icon: ArrowUpWideNarrowIcon },
  "price-low-high": { label: "Price: Low to High", icon: ArrowDownWideNarrowIcon },
  "price-drop": { label: "Biggest Price Drops", icon: TrendingDownIcon },
  "price-increase": { label: "Biggest Price Increases", icon: TrendingUpIcon },
  "best-discount": { label: "Best Discounts", icon: TicketPercentIcon },
}

export const SORT_OPTIONS_GROUPS = [
  {
    label: "Search",
    options: [{ label: "Most Relevant", value: "relevance", icon: SquareStarIcon }],
  },
  {
    label: "Price Intelligence",
    options: [
      { label: "Biggest Price Drops", value: "price-drop", icon: TrendingDownIcon },
      { label: "Biggest Price Increases", value: "price-increase", icon: TrendingUpIcon },
      { label: "Best Discounts", value: "best-discount", icon: TicketPercentIcon },
    ],
  },
  {
    label: "Last Updated",
    options: [
      { label: "Recently Updated", value: "updated-newest", icon: ClockArrowDown },
      { label: "Least Updated", value: "updated-oldest", icon: ClockArrowUp },
    ],
  },
  {
    label: "Name",
    options: [
      { label: "Name: A to Z", value: "a-z", icon: ArrowDownAZ },
      { label: "Name: Z to A", value: "z-a", icon: ArrowUpAZ },
    ],
  },
  {
    label: "Price",
    options: [
      { label: "Price: High to Low", value: "price-high-low", icon: ArrowUpWideNarrowIcon },
      { label: "Price: Low to High", value: "price-low-high", icon: ArrowDownWideNarrowIcon },
    ],
  },
  {
    label: "Date Added",
    options: [
      { label: "Recently Added", value: "created-newest", icon: CalendarArrowDown },
      { label: "Oldest First", value: "created-oldest", icon: CalendarArrowUp },
    ],
  },
]

export const SMART_VIEW_PRESETS = [
  {
    label: "Essential",
    icon: AppleIcon,
    params: { priority: "5" },
  },
  {
    label: "On Sale",
    icon: TicketPercentIcon,
    params: { discounted: "true", sort: "best-discount" },
  },
  {
    label: "Price Drops",
    icon: TrendingDownIcon,
    params: { sort: "price-drop" },
  },
  {
    label: "Price Increases",
    icon: TrendingUpIcon,
    params: { sort: "price-increase" },
  },
] as const

export const FAVORITES_SORT_OPTIONS_GROUPS = [
  {
    label: "Date Favorited",
    options: [
      { label: "Recently Added", value: "recently-added", icon: CalendarArrowDown },
      { label: "Oldest First", value: "oldest-first", icon: CalendarArrowUp },
    ],
  },
  {
    label: "Name",
    options: [
      { label: "Name: A to Z", value: "a-z", icon: ArrowDownAZ },
      { label: "Name: Z to A", value: "z-a", icon: ArrowUpAZ },
    ],
  },
  {
    label: "Price",
    options: [
      { label: "Price: High to Low", value: "price-high-low", icon: ArrowUpWideNarrowIcon },
      { label: "Price: Low to High", value: "price-low-high", icon: ArrowDownWideNarrowIcon },
    ],
  },
]
