"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"

import { SearchContent } from "./SearchContent"

interface SearchContainerProps {
  children: React.ReactNode
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
  const [internalOpen, setInternalOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

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
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [registerKeyboardShortcut, setOpen])

  // clone children to add onClick handler
  const trigger = (
    <div onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(true)}>
      {children}
    </div>
  )

  if (isDesktop) {
    return (
      <>
        {trigger}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl gap-0 overflow-hidden rounded-lg p-0 [&>button]:hidden">
            <DialogTitle className="sr-only">Search products</DialogTitle>
            <DialogDescription className="sr-only">Search for supermarket products</DialogDescription>
            <div className="max-h-[60vh] min-h-[450px]">
              <SearchContent onClose={handleClose} initialQuery={initialQuery} />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {trigger}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85svh]">
          <DrawerTitle className="sr-only">Search products</DrawerTitle>
          <DrawerDescription className="sr-only">Search for supermarket products</DrawerDescription>
          <div className="flex h-[75svh] flex-col overflow-hidden">
            <SearchContent onClose={handleClose} initialQuery={initialQuery} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
