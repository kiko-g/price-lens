import Link from "next/link"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { AppWindowMacIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default function Home() {
  return (
    <Layout>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
        <Button asChild>
          <Link href="/api/" target="_blank">
            <AppWindowMacIcon />
            Test API
          </Link>
        </Button>
      </div>
    </Layout>
  )
}
