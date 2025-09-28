"use client"

import Image from "next/image"
import { redirect } from "next/navigation"
import { signInWithGoogle } from "./actions"
import { useUser } from "@/hooks/useUser"

import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

export default function LoginPage() {
  const { user } = useUser()

  if (user) {
    redirect("/profile")
  }

  return (
    <div className="flex w-full flex-grow flex-col items-center justify-center">
      <HeroGridPattern
        variant="grid"
        className="mask-[linear-gradient(to_top_left,rgba(255,255,255,0.4))]"
        width={16}
        height={16}
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
            We’ll never use your email for spam{" "}
            <span role="img" aria-label="smile">
              😊
            </span>
          </span>
        </div>

        <form action={signInWithGoogle} className="w-full">
          <Button type="submit" variant="marketing-default" className="w-full" size="lg">
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  )
}
