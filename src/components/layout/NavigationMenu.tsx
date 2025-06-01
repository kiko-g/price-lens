"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "@/types"

import { cn } from "@/lib/utils"
import { navigation } from "@/lib/config"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetTrigger, SheetDescription } from "@/components/ui/sheet"

export function NavigationMenu() {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger className="flex items-center justify-center p-[7px] md:hidden">
        <MenuIcon className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="px-1 pb-4 pt-1">
        <SheetHeader className="sr-only">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Sheet menu to navigate through the site</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[400px] w-full px-4 pt-4">
          <div className="flex w-full flex-1 flex-col items-start gap-2">
            {navigation.map((item) => (
              <Entry key={item.href} item={item} isActive={pathname === item.href} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function Entry({ item, isActive }: { item: NavigationItem; isActive: boolean }) {
  if (!item.shown) return null

  return (
    <Link title={item.label} href={item.href} className="w-full">
      <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start pr-4 lg:pr-16">
        {item.icon && <item.icon className="size-4" />}
        <span>{item.label}</span>
      </Button>
    </Link>
  )
}
