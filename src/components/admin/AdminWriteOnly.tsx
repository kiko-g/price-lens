"use client"

import type { ReactNode } from "react"
import { EyeIcon } from "lucide-react"
import { useIsAdmin, useIsReviewer } from "@/contexts/UserContext"
import { Callout } from "@/components/ui/callout"

/**
 * Renders children only for full admins. Wrap admin controls that trigger writes
 * (POST/PUT/PATCH/DELETE, worker triggers, server actions) so a read-only reviewer
 * never sees a button that the middleware would 403 anyway.
 */
export function AdminWriteOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isAdmin = useIsAdmin()
  return <>{isAdmin ? children : fallback}</>
}

/** Small inline note to put where a hidden action bar used to be. */
export function ReadOnlyNote({ className }: { className?: string }) {
  return (
    <span className={className ?? "text-muted-foreground inline-flex items-center gap-1.5 text-xs"}>
      <EyeIcon className="size-3.5" aria-hidden />
      Read-only reviewer — actions hidden
    </span>
  )
}

/** Persistent banner shown at the top of every /admin page for reviewers. */
export function ReviewerReadOnlyBanner() {
  const isReviewer = useIsReviewer()
  if (!isReviewer) return null

  return (
    <Callout variant="info" icon={EyeIcon} className="mx-4 mt-3 py-2">
      <p className="font-medium">Read-only reviewer mode</p>
      <p className="text-muted-foreground text-xs">
        You can browse every dashboard, but scrapes, recomputes, edits and deletes are disabled for this account and
        rejected by the server.
      </p>
    </Callout>
  )
}
