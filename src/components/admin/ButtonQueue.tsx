"use client"

import axios from "axios"
import { Button } from "@/components/ui/button"

export function ButtonQueue() {
  const queue = async () => {
    const { data } = await axios.get("/api/cron/urls")
    console.log(data)
  }

  return <Button onClick={queue}>Queue</Button>
}
