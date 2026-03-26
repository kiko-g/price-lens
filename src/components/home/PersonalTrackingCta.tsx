"use client"

import Link from "next/link"
import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { HeartIcon, ArrowRight } from "lucide-react"

export function PersonalTrackingCta() {
  const { user, isLoading } = useUser()

  if (isLoading) return null

  return (
    <section className="w-full px-4 py-12 md:py-20">
      <div className="from-destructive/5 to-destructive/10 dark:from-destructive/10 dark:to-destructive/5 mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl bg-linear-to-br p-8 text-center md:p-12">
        <div className="bg-destructive/10 dark:bg-destructive/20 flex size-12 items-center justify-center rounded-full">
          <HeartIcon className="text-destructive size-6" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl md:text-3xl">
          Track the products you care about
        </h2>

        <p className="text-muted-foreground max-w-md text-sm leading-relaxed text-balance">
          Save your favorites and we&apos;ll tell you when prices drop. Free, no spam.
        </p>

        {user ? (
          <Button asChild size="lg" className="gap-2">
            <Link href="/favorites">
              Go to your favorites
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="marketing-default" size="lg" className="max-w-xs">
            <Link href="/login">
              <GoogleIcon />
              Continue with Google
            </Link>
          </Button>
        )}
      </div>
    </section>
  )
}
