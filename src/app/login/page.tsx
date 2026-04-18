"use client"

import Image from "next/image"
import { redirect, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { signInWithGoogle } from "./actions"
import { useUser } from "@/hooks/useUser"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { AlertCircleIcon, FlaskConicalIcon } from "lucide-react"

const IS_DEV = process.env.NODE_ENV === "development"

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const nextParam = searchParams.get("next")
  const t = useTranslations("auth.login")

  if (isLoading) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center">
        <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4 px-8 lg:px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (user) {
    redirect(nextParam || "/profile")
  }

  const resolveErrorMessage = (): string | null => {
    if (!errorParam) return null
    if (errorParam === "origin-missing") return t("errors.origin-missing")
    return t("errors.default")
  }
  const errorMessage = resolveErrorMessage()

  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full max-w-lg flex-col items-center justify-center px-8 lg:px-4">
        <h1 className="text-foreground mb-2 flex items-center text-2xl font-semibold">
          <span>{t("loginTo")}</span>
          <div className="ml-2 flex items-center">
            <Image src="/price-lens.svg" alt="Price Lens" width={24} height={24} className="mr-1" />
            <span className="tracking-tighter">Price Lens</span>
          </div>
        </h1>
        <div className="text-muted-foreground mb-4 flex flex-col items-center gap-x-0 gap-y-0.5 text-center text-sm md:flex-row md:gap-x-1">
          <span>
            {t("noSpam")}{" "}
            <span role="img" aria-label={t("smile")}>
              😊
            </span>
          </span>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 text-destructive mb-4 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <form action={signInWithGoogle} className="w-full">
          {nextParam && <input type="hidden" name="next" value={nextParam} />}
          <Button type="submit" variant="marketing-default" className="w-full" size="lg">
            <GoogleIcon />
            {t("continueWithGoogle")}
          </Button>
        </form>

        {IS_DEV && (
          <div className="mt-6 w-full">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-dashed" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">{t("devOnly")}</span>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full border-dashed font-mono text-xs">
              <a href="/api/auth/dev-login">
                <FlaskConicalIcon className="mr-2 h-3.5 w-3.5" />
                {t("signInAsDev")}
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
