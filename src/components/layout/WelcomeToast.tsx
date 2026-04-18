"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { HeartIcon } from "lucide-react"

const ONBOARDED_KEY = "pl_onboarded"

export function WelcomeToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations("layout.welcomeToast")

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return
    if (sessionStorage.getItem("pl_welcomed")) return

    sessionStorage.setItem("pl_welcomed", "1")

    const url = new URL(window.location.href)
    url.searchParams.delete("welcome")
    window.history.replaceState({}, "", url.toString())

    // First-time user: redirect to onboarding
    const hasOnboarded = localStorage.getItem(ONBOARDED_KEY)
    if (!hasOnboarded) {
      router.push("/onboarding")
      return
    }

    // Returning user: show welcome back toast
    setTimeout(() => {
      toast(t("title"), {
        description: t("description"),
        icon: <HeartIcon className="text-destructive size-4" />,
        duration: 5000,
      })
    }, 500)
  }, [searchParams, router, t])

  return null
}

export function markOnboardingComplete() {
  if (typeof window !== "undefined") {
    localStorage.setItem(ONBOARDED_KEY, "1")
  }
}
