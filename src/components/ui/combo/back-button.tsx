"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

import { ArrowLeftIcon } from "lucide-react"

export function BackButton() {
  const t = useTranslations("common.ui")
  return (
    <Button variant="outline" onClick={() => window.history.back()}>
      <ArrowLeftIcon className="h-4 w-4" />
      {t("goBack")}
    </Button>
  )
}
