"use client"

import Image from "next/image"
import { redirect, useSearchParams } from "next/navigation"
import { signInWithGoogle } from "./actions"
import { useUser } from "@/hooks/useUser"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { AlertCircleIcon } from "lucide-react"

const errorMessages: Record<string, string> = {
  "origin-missing": "Something went wrong starting the sign-in flow. Please try again.",
  default: "Sign-in failed. Please try again.",
}

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const nextParam = searchParams.get("next")

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

  const errorMessage = errorParam ? (errorMessages[errorParam] ?? errorMessages.default) : null

  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full max-w-lg flex-col items-center justify-center px-8 lg:px-4">
        <h1 className="text-foreground mb-2 flex items-center text-2xl font-semibold">
          <span>Login to</span>
          <div className="ml-2 flex items-center">
            <Image src="/price-lens.svg" alt="Price Lens" width={24} height={24} className="mr-1" />
            <span className="tracking-tighter">Price Lens</span>
          </div>
        </h1>
        <div className="text-muted-foreground mb-4 flex flex-col items-center gap-x-0 gap-y-0.5 text-center text-sm md:flex-row md:gap-x-1">
          <span>
            We'll never use your email for spam{" "}
            <span role="img" aria-label="smile">
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
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  )
}
