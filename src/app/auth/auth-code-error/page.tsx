import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { pageMetadata } from "@/lib/config"

import { LogIn, HomeIcon } from "lucide-react"

export const metadata: Metadata = pageMetadata(
  "Sign-in Failed",
  "We couldn't complete your sign-in. Please try again.",
)

export default function AuthCodeErrorPage() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full flex-col items-center justify-center gap-3 px-4">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Sign-in failed</h1>
        <p className="text-muted-foreground max-w-md text-center">
          We couldn&apos;t complete your sign-in. This can happen if the session expired or you cancelled the flow.
        </p>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Try again
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/" prefetch={false}>
              <HomeIcon className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
