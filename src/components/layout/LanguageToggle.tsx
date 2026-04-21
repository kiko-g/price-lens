"use client"

import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

import { LanguagesIcon } from "lucide-react"

import { setLocaleAction } from "@/app/actions/locale"
import { locales, type Locale, isLocale } from "@/i18n/config"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Variant = "segmented" | "compact" | "dropdown-item"

interface LanguageToggleProps {
  variant?: Variant
  className?: string
}

export function LanguageToggle({ variant = "segmented", className }: LanguageToggleProps) {
  const currentLocaleRaw = useLocale()
  const current: Locale = isLocale(currentLocaleRaw) ? currentLocaleRaw : "pt"
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("common")

  const handleSelect = (locale: Locale) => {
    if (locale === current) return
    startTransition(async () => {
      await setLocaleAction(locale)
    })
  }

  if (variant === "dropdown-item") {
    const next: Locale = current === "pt" ? "en" : "pt"
    return (
      <Button
        variant="dropdown-item"
        onClick={() => handleSelect(next)}
        className={cn("w-full", className)}
        disabled={isPending}
      >
        <LanguagesIcon className="size-4" />
        <span className="w-full text-left">{t(`languages.${next}` as const)}</span>
      </Button>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center rounded", className)}>
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => handleSelect(locale)}
            disabled={isPending || locale === current}
            aria-pressed={locale === current}
            className={cn(
              "px-2 py-1 text-xs font-medium transition-colors first:rounded-l last:rounded-r",
              locale === current
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/20 bg-primary/10",
            )}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-muted/50 inline-flex items-center gap-1 rounded-md border p-0.5",
        isPending && "opacity-70",
        className,
      )}
      role="radiogroup"
      aria-label={t("labels.language")}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          role="radio"
          aria-checked={locale === current}
          disabled={isPending}
          onClick={() => handleSelect(locale)}
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors",
            locale === current
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`languages.${locale}` as const)}
        </button>
      ))}
    </div>
  )
}
