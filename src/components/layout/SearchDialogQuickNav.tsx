"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchDialog } from "@/components/layout/SearchDialog"

import { SearchIcon, ShoppingCartIcon } from "lucide-react"
import { BorderBeam } from "@/components/magicui/border-beam"

export function SearchDialogQuickNav() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end justify-center gap-3 md:right-8 md:bottom-8">
      <SearchDialog>
        <Button
          variant="default"
          size="icon-lg"
          roundedness="circular"
          className="relative border-transparent"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <SearchIcon className="size-4" />
          <BorderBeam duration={2} size={60} colorFrom="var(--color-secondary)" colorTo="var(--color-secondary)" />
        </Button>
      </SearchDialog>
    </div>
  )
}
