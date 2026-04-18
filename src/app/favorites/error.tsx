"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function FavoritesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations()
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground text-sm">{t("errors.boundary.favorites")}</p>
      <Button variant="outline" size="sm" onClick={reset}>
        {t("common.actions.retry")}
      </Button>
    </div>
  )
}
