import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Schedule | Admin",
}

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
