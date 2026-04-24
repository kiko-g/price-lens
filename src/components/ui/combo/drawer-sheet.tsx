import { useCallback, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { ChartSplineIcon } from "lucide-react"

const DefaultTrigger = (
  <Button size="icon-sm">
    <ChartSplineIcon />
  </Button>
)

function useSheetOpen(
  controlledOpen: boolean | undefined,
  onControlledOpenChange: ((open: boolean) => void) | undefined,
) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onControlledOpenChange?.(next)
    },
    [isControlled, onControlledOpenChange],
  )
  return { open, onOpenChange }
}

export function DrawerSheet({
  children,
  title,
  description,
  trigger = DefaultTrigger,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  /** Pass `null` to omit a trigger and control opening via `open` / `onOpenChange` (e.g. from a menu item). */
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { open, onOpenChange } = useSheetOpen(controlledOpen, onControlledOpenChange)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const effectiveTrigger = trigger === undefined ? DefaultTrigger : trigger
  const hasTrigger = trigger !== null

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {hasTrigger ? (
          <SheetTrigger asChild className="top-4">
            {effectiveTrigger}
          </SheetTrigger>
        ) : null}
        <SheetContent className="overflow-x-hidden overflow-y-scroll">
          <SheetHeader>
            <SheetTitle className="text-left">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>

          <div className="pt-2 pb-8">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {hasTrigger ? (
        <DrawerTrigger asChild className="top-4">
          {effectiveTrigger}
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          {description ? <DrawerDescription className="text-left">{description}</DrawerDescription> : null}
        </DrawerHeader>

        <div className="no-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pt-2 pb-8">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
