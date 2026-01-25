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
      { label: "A to Z", value: "a-z", icon: ArrowDownAZ },
      { label: "Z to A", value: "z-a", icon: ArrowUpAZ },
    ],
  },
  {
    label: "Price",
    options: [
      { label: "High to Low", value: "price-high-low", icon: ArrowUpWideNarrowIcon },
      { label: "Low to High", value: "price-low-high", icon: ArrowDownWideNarrowIcon },
    ],
  },
  {
    label: "Last Updated",
    options: [
      { label: "Recently Updated", value: "updated-newest", icon: ClockArrowDown },
      { label: "Least Recently", value: "updated-oldest", icon: ClockArrowUp },
    ],
  },
  {
    label: "Date Added",
    options: [
      { label: "Newest First", value: "created-newest", icon: CalendarArrowDown },
      { label: "Oldest First", value: "created-oldest", icon: CalendarArrowUp },
    ],
  },
]
