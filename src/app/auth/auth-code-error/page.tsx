import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { pageMetadataFromKey } from "@/lib/config"

import { LogIn, HomeIcon } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("authError")
}

export default async function AuthCodeErrorPage() {
  const t = await getTranslations("errors.authCode")
  const tCommon = await getTranslations("common.actions")
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
          <Button asChild>
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              {tCommon("retry")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
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
