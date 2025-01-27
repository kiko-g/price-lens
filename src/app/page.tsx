import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { ScheduleJob } from "@/components/ScheduleJob"
import { ButtonApiTest } from "@/components/ButtonApiTest"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

export default function Home() {
  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-center gap-3">
        <ScheduleJob />
        <ButtonApiTest />
      </div>
    </Layout>
  )
}
