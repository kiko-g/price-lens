"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Heart, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { useUser } from "@/hooks/useUser"

export function DiagonalSplitCtaRight() {
  const { user, isLoading } = useUser()
  const t = useTranslations("home.diagonalRight")

  return (
    <div
      className={cn(
        "flex-1 overflow-hidden rounded-3xl shadow-sm",
        "from-destructive/5 to-destructive/10 dark:from-destructive/15 dark:to-destructive/10 bg-linear-to-bl",
        "md:[clip-path:polygon(18%_0,100%_0,100%_100%,0%_100%)]",
      )}
    >
      <div className="flex h-full flex-col items-end justify-center gap-5 px-8 py-10 text-right md:px-10 md:py-14 md:pl-24">
        <div className="bg-destructive/80 border-destructive dark:bg-destructive/40 dark:border-destructive/70 flex size-12 items-center justify-center rounded-full border">
          <Heart className="text-destructive-foreground fill-destructive-foreground size-5" />
        </div>

        <h2 className="text-xl font-extrabold tracking-tight text-balance sm:text-2xl">{t("title")}</h2>

        <p className="text-muted-foreground max-w-[260px] text-sm leading-relaxed text-pretty">{t("body")}</p>

        {isLoading ? (
          <div className="h-11" />
        ) : user ? (
          <Button asChild size="lg" roundedness="xl" className="group gap-2">
            <Link href="/favorites">
              {t("goFavorites")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="marketing-default" size="lg" roundedness="xl" className="max-w-xs">
            <Link href="/login">
              <GoogleIcon />
              {t("continueGoogle")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
