"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

import { HomeIcon } from "lucide-react"

export default function ErrorPage() {
  const t = useTranslations("errors.page")
  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full flex-col items-center justify-center gap-3 px-4">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground max-w-md text-center">{t("body")}</p>
        <div className="flex items-center gap-2">
          <BackButton />
          <Button asChild>
            <Link href="/" prefetch={false}>
              <HomeIcon className="h-4 w-4" />
              {t("goHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
