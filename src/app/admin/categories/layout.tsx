import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories | Admin",
}

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
