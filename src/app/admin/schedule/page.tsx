"use client"

import { ScheduleOverviewSection } from "./_components/schedule-overview-section"
import { PriorityBrowserSection } from "./_components/priority-browser-section"
import { ScrapeHistorySection } from "./_components/scrape-history-section"

export default function SchedulePage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <ScheduleOverviewSection />
        <PriorityBrowserSection />
        <ScrapeHistorySection />
      </div>
    </div>
  )
}
