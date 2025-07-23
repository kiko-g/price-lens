"use client"

import { navigation } from "@/lib/config"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { GithubIcon } from "@/components/icons"
import { LogoLink } from "@/components/layout/LogoLink"
import { NavigationMenu } from "@/components/layout/NavigationMenu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

import { signOut } from "@/app/login/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/useUser"

import { LogInIcon, LogOut, User as UserIcon } from "lucide-react"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-opacity-95 dark:bg-opacity-95 sticky top-0 z-50 mx-auto h-[54px] w-full border-b bg-zinc-50 backdrop-blur backdrop-filter xl:px-4 dark:bg-zinc-950">
      <div className="flex h-full items-center justify-between px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
        <div className="flex items-center gap-3">
          <LogoLink />
          <span className="text-2xs/4 inline-flex items-center rounded-full bg-linear-to-br from-orange-600/70 to-rose-600/70 px-1 font-bold tracking-tighter text-white capitalize md:px-1.5 md:py-0.5 md:text-xs/4 md:font-semibold dark:from-orange-400 dark:to-rose-500">
            Early Access
          </span>

          <nav className="ml-3 hidden items-center gap-1.5 md:flex">
            {navigation
              .filter((item) => item.shown)
              .map((item) => (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn("", pathname === item.href && "bg-zinc-200 dark:bg-zinc-100/20")}
                  key={item.href}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
          </nav>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-1.5">
          <ThemeToggle className="hidden md:inline-flex" />
          <UserDropdownMenu />
          <NavigationMenu />
        </div>
      </div>
    </header>
  )
}

function UserDropdownMenu() {
  const { user, profile, isLoading } = useUser()

  if (isLoading) {
    return <Skeleton className="ml-2 h-8 w-8 rounded-full md:ml-0" />
  }

  if (!user) {
    return (
      <Button asChild size="icon" variant="ghost" className="ml-2 md:ml-0">
        <Link href="/login">
          <LogInIcon className="h-4 w-4" />
          <span className="sr-only">Login</span>
        </Link>
      </Button>
    )
  }

  function getUserBadgeText() {
    if (profile?.role === "admin") return "Admin"
    else if (profile?.plan === "free") return "Free"
    else if (profile?.plan === "plus") return "Plus"
    else return ""
  }

  const userBadgeText = getUserBadgeText()
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="ml-2 md:ml-0">
        <Button variant="outline" className="relative h-7 w-7 rounded-full">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name ?? "User"} />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <span className="sr-only">User</span>
          <Badge
            size="3xs"
            variant="default"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 leading-none capitalize"
          >
            {userBadgeText}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user.user_metadata.full_name}</p>
            <p className="text-muted-foreground text-xs leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <form action={signOut} className="w-full">
            <Button type="submit" variant="dropdown-item" className="h-full w-full justify-start px-2 font-normal">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
