import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

import { cn } from "@/lib/utils"
import { Providers } from "./providers"
import { Analytics } from "@/components/Analytics"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(GeistSans.className)}>
        <Providers>
          <Analytics />
          {children}
        </Providers>
      </body>
    </html>
  )
}
