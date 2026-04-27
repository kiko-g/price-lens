import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { pageMetadataFromKey } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

import { HomeIcon } from "lucide-react"

const NOT_FOUND_STATUS = "404"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("notFound")
}

export default async function NotFound() {
  const t = await getTranslations("errors.notFound")
  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full flex-col items-center justify-center gap-3 px-4">
        <h1 className="animate-bounce text-4xl font-bold tracking-tighter sm:text-5xl">{NOT_FOUND_STATUS}</h1>
        <p className="text-muted-foreground max-w-lg text-center">
          {t("line1")}
          <br />
          {t("line2")}
        </p>
        <div className="flex items-center gap-2">
          <BackButton />
          <Button asChild>
            <Link href="/" prefetch={false}>
              <HomeIcon className="h-4 w-4" />
              {t("returnHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
