"use client"

import { ScrapeHistorySection } from "./_components/scrape-history-section"

export default function ScrapeHistoryPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <ScrapeHistorySection />
      </div>
    </div>
  )
}
