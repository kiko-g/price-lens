"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer"

import { MenuIcon } from "lucide-react"
import { NavigationItem } from "@/types"

export function NavigationDrawer() {
  const pathname = usePathname()

  return (
    <Drawer>
      <DrawerTrigger className="flex items-center justify-center p-[7px] md:hidden">
        <MenuIcon className="size-4" />
      </DrawerTrigger>
      <DrawerContent className="px-1 pb-4 pt-1">
        <DrawerHeader className="sr-only">
          <DrawerTitle className="sr-only">Navigation</DrawerTitle>
          <DrawerDescription className="sr-only">Drawer menu to navigate through the site</DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="h-[400px] pt-4"></ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

function Entry({ item, isActive }: { item: NavigationItem; isActive: boolean }) {
  return (
    <Link
      title={item.name}
      href={item.href}
      className={cn(
        isActive ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400",
        "mx-3 flex cursor-pointer items-center justify-start gap-2 rounded-md border-0 px-3 py-2.5 leading-none transition ease-in-out",
      )}
    >
      <div className="w-full items-center gap-1.5 pr-4 lg:pr-16">
        <span>{item.name}</span>
        {item.isNew && (
          <span className="inline-flex items-center rounded-full bg-teal-700 px-[5px] py-[3px] text-white dark:bg-teal-600">
            <span className="text-3xs font-semibold leading-none tracking-tight">New</span>
          </span>
        )}
      </div>
    </Link>
  )
}
