"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"
import { MoonIcon, SunIcon } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const otherTheme = resolvedTheme === "dark" ? "light" : "dark"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={mounted ? `Switch to ${otherTheme} theme` : "Toggle theme"}
      onClick={() => setTheme(otherTheme)}
      className={cn("shadow-none", className)}
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:inline-flex" />
    </Button>
  )
}
