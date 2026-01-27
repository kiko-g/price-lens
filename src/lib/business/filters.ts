import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpWideNarrowIcon,
  ArrowDownWideNarrowIcon,
  ClockArrowDown,
  ClockArrowUp,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react"

export const SORT_OPTIONS_GROUPS = [
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
    label: "Last Updated",
    options: [
      { label: "Recently Updated", value: "updated-newest", icon: ClockArrowDown },
      { label: "Least Updated", value: "updated-oldest", icon: ClockArrowUp },
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
