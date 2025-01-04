"use client"

import { Button } from "@/components/ui/button"
import { AppWindowMacIcon } from "lucide-react"

async function playground() {
  const response = await fetch("/api/supabase/populate", {
    method: "POST",
  })
  const data = await response.json()
  console.debug(data)
}

export function ButtonApiTest() {
  return (
    <div className="flex w-full max-w-md items-center justify-center gap-4">
      <Button onClick={() => playground()}>
        <AppWindowMacIcon />
        Test Scraper
      </Button>
    </div>
  )
}
