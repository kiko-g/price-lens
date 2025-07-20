"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "@/types"
import { GithubIcon } from "@/components/icons"
import { LogInIcon, MenuIcon } from "lucide-react"

import { useUser } from "@/hooks/useUser"
import { navigation, siteConfig } from "@/lib/config"

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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

import { ThemeToggle } from "@/components/layout/ThemeToggle"

export function NavigationMenu() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()
  const profileImage = user?.user_metadata.avatar_url

  return (
    <Sheet>
      <SheetTrigger className="flex items-center justify-center rounded-md p-2 md:hidden" asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="size-4" />
        </Button>
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

        <SheetFooter className="mb-2">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : !user ? (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                  <LogInIcon className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/profile">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={profileImage} alt={user?.user_metadata.full_name ?? "User"} />
                    <AvatarFallback>{user?.user_metadata.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Profile</span>
                </Link>
              </Button>
            )}

            <Button variant="outline" size="icon" asChild className="border-border shadow-none md:border-transparent">
              <Link target="_blank" href={siteConfig.links.repo}>
                <GithubIcon />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
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
