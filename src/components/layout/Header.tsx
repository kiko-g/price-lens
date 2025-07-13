"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { adminNavigation, navigation, siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

import { GithubIcon } from "@/components/icons"
import { LogoLink } from "@/components/layout/LogoLink"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { NavigationMenu } from "@/components/layout/NavigationMenu"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/hooks/useUser"
import { signOut } from "@/app/login/actions"
import { Skeleton } from "@/components/ui/skeleton"

import { ShieldEllipsisIcon, LogOut, User as UserIcon, LogInIcon } from "lucide-react"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 mx-auto h-[54px] w-full border-b bg-zinc-50 bg-opacity-95 backdrop-blur backdrop-filter dark:bg-zinc-950 dark:bg-opacity-95 xl:px-4">
      <div className="flex h-full items-center justify-between px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
        <div className="flex items-center gap-3">
          <LogoLink />
          <span className="inline-flex items-center rounded-full bg-gradient-to-br from-orange-600/70 to-rose-600/70 px-1.5 py-0.5 text-xs/4 font-bold capitalize tracking-tight text-white">
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

        <div className="flex items-center justify-center gap-0.5 md:gap-1.5">
          <Button variant="ghost" size="icon-sm" asChild className="hidden md:inline-flex">
            <Link target="_blank" href={siteConfig.links.repo}>
              <GithubIcon />
            </Link>
          </Button>
          <ThemeToggle />

          <UserDropdownMenu />
          <NavigationMenu />
        </div>
      </div>
    </header>
  )
}

function UserDropdownMenu() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  if (!user) {
    return (
      <Button asChild size="icon-sm" variant="ghost" className="shadow-none">
        <Link href="/login">
          <LogInIcon className="h-4 w-4" />
          <span className="sr-only">Login</span>
        </Link>
      </Button>
    )
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-7 w-7 rounded-full">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name ?? "User"} />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <form action={signOut} className="w-full">
            <Button type="submit" variant="dropdown-item" className="h-full w-full justify-start px-2 font-normal">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminDropdownMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon-sm" className="shadow-none">
          <ShieldEllipsisIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuLabel>Administration</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {adminNavigation.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Button variant="dropdown-item" asChild>
              <Link href={item.href} className="flex w-full items-center justify-between gap-1">
                {item.label}
                <item.icon className="h-4 w-4" />
              </Link>
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
