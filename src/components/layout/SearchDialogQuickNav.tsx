"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchDialog } from "@/components/layout/SearchDialog"

import { SearchIcon, ShoppingCartIcon } from "lucide-react"
import { BorderBeam } from "@/components/ui/magic/border-beam"

export function SearchDialogQuickNav() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed right-5 bottom-7 z-50 flex flex-col items-end justify-center gap-3 md:right-8 md:bottom-10">
      <SearchDialog>
        <Button
          variant="default"
          size="icon-xl"
          roundedness="circular"
          className="relative border-transparent"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <SearchIcon />
          <BorderBeam
            duration={2}
            size={60}
            colorFrom="var(--color-secondary)"
            colorTo="var(--color-secondary)"
            borderWidth={3}
          />
        </Button>
      </SearchDialog>
    </div>
  )
}
