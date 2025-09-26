"use client"

import { Button } from "@/components/ui/button"

import { ArrowLeftIcon } from "lucide-react"

export function BackButton() {
  return (
    <Button variant="outline" onClick={() => window.history.back()}>
      <ArrowLeftIcon className="h-4 w-4" />
      Go back
    </Button>
  )
}
