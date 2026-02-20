"use client"

import { Button } from "@/components/ui/button"
import { SearchContainer } from "@/components/layout/search"

import { SearchIcon } from "lucide-react"
import { BorderBeam } from "@/components/ui/magic/border-beam"

export function SearchDialogQuickNav() {
  return (
    <div className="fixed right-5 bottom-7 z-50 flex flex-col items-end justify-center gap-3 md:right-8 md:bottom-10">
      <SearchContainer registerKeyboardShortcut={false}>
        <Button variant="default" size="icon-xl" roundedness="circular" className="relative border-transparent">
          <SearchIcon />
          <BorderBeam
            duration={2}
            size={60}
            colorFrom="var(--color-secondary)"
            colorTo="var(--color-secondary)"
            borderWidth={3}
          />
        </Button>
      </SearchContainer>
    </div>
  )
}
