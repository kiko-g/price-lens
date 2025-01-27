"use client"

import { Button } from "@/components/ui/button"
import { ClockIcon } from "lucide-react"

async function scheduleJob() {
  fetch(`/api/schedule`, {
    method: "GET",
  })
}

export function ScheduleJob() {
  return (
    <Button onClick={() => scheduleJob()}>
      <ClockIcon />
      Schedule Job
    </Button>
  )
}
