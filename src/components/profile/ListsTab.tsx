"use client"

import { Button } from "@/components/ui/button"
import { EmptyStateView } from "@/components/ui/combo/state-views"
import { ListIcon } from "lucide-react"

export function ListsTab() {
  return (
    <EmptyStateView
      icon={ListIcon}
      title="No lists yet"
      message="Create shopping lists to track products across stores and find the best deals."
      actions={
        <Button variant="outline" size="sm" disabled>
          Coming Soon
        </Button>
      }
    />
  )
}
