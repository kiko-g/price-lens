"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"

type Variant = "default" | "love" | "hype" | "caution" | "destructive"

const ResponsiveActionsContext = React.createContext({ isDesktop: true })

export function useIsDesktopActions() {
  return React.useContext(ResponsiveActionsContext).isDesktop
}

interface ResponsiveActionsMenuProps {
  trigger: React.ReactNode
  title?: string
  children: React.ReactNode
}

export function ResponsiveActionsMenu({ trigger, title = "Actions", children }: ResponsiveActionsMenuProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <ResponsiveActionsContext value={{ isDesktop }}>
      {isDesktop ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[300px]" align="end">
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Drawer>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-left">{title}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-0.5 pb-4">{children}</div>
          </DrawerContent>
        </Drawer>
      )}
    </ResponsiveActionsContext>
  )
}

const VARIANT_MOBILE_CLASSES: Record<Variant, string> = {
  default: "text-foreground active:bg-accent",
  love: "text-rose-500 active:bg-rose-500/20",
  hype: "text-sky-500 active:bg-sky-400/20",
  caution: "text-amber-700 active:bg-amber-700/10 dark:text-amber-200",
  destructive: "text-destructive active:bg-destructive/20",
}

interface ResponsiveActionsMenuItemProps {
  variant?: Variant
  onClick?: () => void
  disabled?: boolean
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

export function ResponsiveActionsMenuItem({
  variant = "default",
  onClick,
  disabled,
  asChild,
  children,
  className,
}: ResponsiveActionsMenuItemProps) {
  const { isDesktop } = React.useContext(ResponsiveActionsContext)

  if (isDesktop) {
    return (
      <DropdownMenuItem variant={variant} onClick={onClick} disabled={disabled} asChild={asChild} className={className}>
        {children}
      </DropdownMenuItem>
    )
  }

  if (asChild) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors [&_svg]:size-5 [&_svg]:shrink-0",
          VARIANT_MOBILE_CLASSES[variant],
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors [&_svg]:size-5 [&_svg]:shrink-0",
        VARIANT_MOBILE_CLASSES[variant],
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {children}
    </button>
  )
}
