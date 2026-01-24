"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

import { SearchIcon } from "lucide-react"

export default function DebugPage() {
  const [queryInput, setQueryInput] = useState("")

  function handleSearch() {
    console.log("search", queryInput)
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pr-16 pl-8 text-base md:text-sm"
            value={queryInput}
            onChange={(e) => {
              setQueryInput(e.target.value)
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>
    </div>
  )
}
