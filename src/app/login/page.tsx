"use client"

import { signInWithGoogle } from "./actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeftIcon } from "lucide-react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="absolute top-4 left-4 md:top-8 md:left-8">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Core
            </Link>
          </Button>
        </div>

        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <ThemeToggle />
        </div>

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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
