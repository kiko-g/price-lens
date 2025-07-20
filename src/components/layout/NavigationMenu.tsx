"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "@/types"

import { cn } from "@/lib/utils"
import { navigation } from "@/lib/config"
import { MenuIcon } from "lucide-react"
import { useUser } from "@/hooks/useUser"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

export function NavigationMenu() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()

  return (
    <Sheet>
      <SheetTrigger className="flex items-center justify-center rounded-md border border-border p-2 shadow-none md:hidden md:border-transparent">
        <MenuIcon className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col px-4 py-4">
        <SheetHeader className="space-y-0">
          <SheetTitle className="text-left">Navigation</SheetTitle>
          <SheetDescription className="text-left">Jump to a page</SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 w-full flex-1">
          <div className="flex w-full flex-1 flex-col items-start gap-2">
            {navigation.map((item) => (
              <Entry key={item.href} item={item} isActive={pathname === item.href} />
            ))}
          </div>
        </ScrollArea>

        <SheetFooter>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : !user ? (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Login</Link>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/profile">Profile</Link>
            </Button>
          )}
        </SheetFooter>
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
