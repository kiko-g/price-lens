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
  BadgePercentIcon,
} from "lucide-react"

export const SORT_OPTIONS_GROUPS = [
  {
    label: "Price Intelligence",
    options: [
      { label: "Biggest Price Drops", value: "price-drop", icon: TrendingDownIcon },
      { label: "Biggest Price Increases", value: "price-increase", icon: TrendingUpIcon },
      { label: "Best Discounts", value: "best-discount", icon: BadgePercentIcon },
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
    label: "Price Drops",
    icon: TrendingDownIcon,
    params: { sort: "price-drop" },
  },
  {
    label: "On Sale",
    icon: BadgePercentIcon,
    params: { discounted: "true", sort: "best-discount" },
  },
  {
    label: "New Products",
    icon: CalendarArrowDown,
    params: { sort: "created-newest" },
  },
  {
    label: "Essential",
    icon: ArrowUpWideNarrowIcon,
    params: { priority: "5" },
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
