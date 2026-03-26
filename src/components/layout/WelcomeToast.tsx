"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { HeartIcon } from "lucide-react"

export function WelcomeToast() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return
    if (sessionStorage.getItem("pl_welcomed")) return

    sessionStorage.setItem("pl_welcomed", "1")

    const url = new URL(window.location.href)
    url.searchParams.delete("welcome")
    window.history.replaceState({}, "", url.toString())

    setTimeout(() => {
      toast("Welcome to Price Lens!", {
        description: "Start adding favorites to track prices on the products you care about.",
        icon: <HeartIcon className="text-destructive size-4" />,
        duration: 6000,
      })
    }, 500)
  }, [searchParams])

  return null
}
