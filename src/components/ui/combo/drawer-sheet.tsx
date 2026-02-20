import { useState } from "react"
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

export function DrawerSheet({
  children,
  title,
  description,
  trigger = DefaultTrigger,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="top-4">
          {trigger}
        </SheetTrigger>
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild className="top-4">
        {trigger}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          {description ? <DrawerDescription className="text-left">{description}</DrawerDescription> : null}
        </DrawerHeader>

        <div className="no-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pt-2 pb-8">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
