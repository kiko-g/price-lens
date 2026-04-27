"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Slot } from "@radix-ui/react-slot"
import { useTranslations } from "next-intl"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

import { SearchContent } from "./SearchContent"

interface SearchContainerProps {
  /** A single React element that will receive the trigger props (onClick, onKeyDown). Must be a button or interactive element. */
  children: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialQuery?: string
  /** When true (default), this instance registers Cmd+K/Ctrl+K. Only one instance on the page should be true to avoid stacked modals. */
  registerKeyboardShortcut?: boolean
}

export function SearchContainer({
  children,
  open: controlledOpen,
  onOpenChange,
  initialQuery,
  registerKeyboardShortcut = true,
}: SearchContainerProps) {
  const t = useTranslations("search")
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const handleClose = useCallback((): void => {
    setOpen(false)
  }, [setOpen])

  useEffect(() => {
    if (!registerKeyboardShortcut) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (onOpenChange) {
          onOpenChange(!open)
        } else {
          setInternalOpen((prev) => !prev)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [registerKeyboardShortcut, onOpenChange, open])

  const trigger = (
    <Slot onClick={() => setOpen(true)} onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && setOpen(true)}>
      {children}
    </Slot>
  )

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=closed]:slide-out-to-left-0 max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=open]:slide-in-from-left-0 w-full flex-1 gap-0 overflow-hidden p-0 max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:h-[85svh] max-md:max-h-[85svh] max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0 md:max-w-3xl md:rounded-lg [&>button]:hidden">
          <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("dialogDescription")}</DialogDescription>
          <div className="min-h-0 flex-1 overflow-hidden md:max-h-[60vh] md:min-h-[450px]">
            <SearchContent onClose={handleClose} initialQuery={initialQuery} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
