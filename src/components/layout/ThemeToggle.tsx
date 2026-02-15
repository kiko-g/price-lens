"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button, ButtonProps } from "@/components/ui/button"

import { cn } from "@/lib/utils"
import { ContrastIcon } from "lucide-react"

type Props = {
  className?: string
  size?: ButtonProps["size"]
  variant?: ButtonProps["variant"]
}

export function ThemeToggle({ className, size = "icon", variant = "outline" }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const otherTheme = resolvedTheme === "dark" ? "light" : "dark"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button
      size={size}
      variant={variant}
      aria-label={mounted ? `Switch to ${otherTheme} theme` : "Toggle theme"}
      onClick={() => setTheme(otherTheme)}
      className={cn("shadow-none", className)}
    >
      <ContrastIcon className="size-4 dark:rotate-180" />
    </Button>
  )
}
