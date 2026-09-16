import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { AlertCircleIcon, ArrowLeftIcon, EyeIcon, LogInIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { pageMetadataFromKey } from "@/lib/config"
import { signInWithPassword } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Callout } from "@/components/ui/callout"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("login")
}

type SearchParams = Promise<{ error?: string; next?: string }>

const ERROR_KEYS = new Set(["missing", "invalid"])

/**
 * Email + password sign-in for the dedicated read-only reviewer account.
 * Intentionally unlinked from the consumer login page: shoppers keep Google OAuth.
 * Requires the Email provider to be enabled in Supabase Auth (see docs/reviewer-role.md).
 */
export default async function ReviewerLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, next } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile")

  const t = await getTranslations("auth.reviewerLogin")
  const errorKey = error && ERROR_KEYS.has(error) ? (error as "missing" | "invalid") : null

  return (
    <div className="relative flex w-full grow flex-col items-center justify-center px-4 py-8 md:py-12">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="bg-card relative z-10 flex w-full max-w-md flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-semibold">
            <EyeIcon className="text-primary size-5" aria-hidden />
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("subtitle")}</p>
        </div>

        {errorKey && (
          <Callout variant="destructive" icon={AlertCircleIcon}>
            {t(`errors.${errorKey}`)}
          </Callout>
        )}

        <form action={signInWithPassword} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reviewer-email">{t("emailLabel")}</Label>
            <Input
              id="reviewer-email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              className="text-base md:text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reviewer-password">{t("passwordLabel")}</Label>
            <Input
              id="reviewer-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="text-base md:text-sm"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            <LogInIcon className="size-4" aria-hidden />
            {t("submit")}
          </Button>
        </form>

        <p className="text-muted-foreground text-xs">{t("readOnlyHint")}</p>

        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/login">
            <ArrowLeftIcon className="size-4" aria-hidden />
            {t("backToGoogle")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
