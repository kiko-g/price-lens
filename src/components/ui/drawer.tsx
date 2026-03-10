"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"

function setBodyLocked(locked: boolean) {
  const root = document.documentElement
  const body = document.body
  body.classList.toggle("drawer-open", locked)

  if (locked) {
    root.classList.add("drawer-no-overscroll")
  } else {
    root.classList.remove("drawer-no-overscroll")
  }
}

const Drawer = ({
  shouldScaleBackground = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => {
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setBodyLocked(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  React.useEffect(() => {
    return () => setBodyLocked(false) // cleanup on unmount
  }, [])

  return (
    <DrawerPrimitive.Root
      // modal is important to block outside interaction/scroll
      modal
      shouldScaleBackground={shouldScaleBackground}
      onOpenChange={handleOpenChange}
      {...props}
    />
  )
}
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    // pointer/touch blocked here so the page underneath never scrolls
    className={cn("pointer-events-auto fixed inset-0 z-50 touch-none bg-black/50", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

type DrawerDirection = "bottom" | "top" | "left" | "right"

const DIRECTION_CLASSES: Record<DrawerDirection, string> = {
  bottom:
    "inset-x-0 bottom-0 mt-24 h-auto max-h-[90svh] touch-pan-y rounded-t-2xl border-t pb-[env(safe-area-inset-bottom,0px)]",
  top: "inset-x-0 top-0 mb-24 h-auto max-h-[90svh] touch-pan-y rounded-b-2xl border-b pt-[env(safe-area-inset-top,0px)]",
  left: "inset-y-0 left-0 h-full w-[85%] max-w-sm touch-pan-x rounded-r-2xl border-r",
  right: "inset-y-0 right-0 h-full w-[85%] max-w-sm touch-pan-x rounded-l-2xl border-l",
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    direction?: DrawerDirection
  }
>(({ className, children, direction = "bottom", ...props }, ref) => {
  const isVertical = direction === "bottom" || direction === "top"

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "bg-background fixed z-50 flex transform-gpu flex-col overscroll-contain will-change-transform",
          DIRECTION_CLASSES[direction],
          className,
        )}
        {...props}
      >
        {isVertical && (
          <div className="flex w-full cursor-grab items-center justify-center py-5 active:cursor-grabbing md:py-4">
            <div className="bg-muted-foreground/40 h-1.5 w-12 rounded-full" />
          </div>
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 px-4 pb-3 text-center sm:text-left", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg leading-none font-semibold tracking-tight", className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
