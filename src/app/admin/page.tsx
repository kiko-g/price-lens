import type { Metadata } from "next"
import { Layout } from "@/components/layout"
import { ButtonQueue } from "@/components/admin/ButtonQueue"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default async function Admin() {
  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <ButtonQueue />
      </div>
    </Layout>
  )
}
