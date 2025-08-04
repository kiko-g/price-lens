"use client"

import { useTheme } from "next-themes"
import Link from "next/link"
import { useEffect, useState } from "react"

import { signOut } from "@/app/login/actions"
import { useUser } from "@/hooks/useUser"

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

import { GithubIcon } from "@/components/icons"
import { LogOut, MoonIcon, SunIcon, UserIcon, HeartIcon } from "lucide-react"

export function UserDropdownMenu() {
  const { user, profile, isLoading } = useUser()
  const { resolvedTheme: theme, setTheme } = useTheme()

  if (isLoading) {
    return <Skeleton className="size-[34px] rounded-lg border md:ml-0" />
  }

  if (!user) {
    return (
      <Button asChild size="icon" variant="outline" className="md:ml-0">
        <Link href="/login">
          <UserIcon className="h-4 w-4" />
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
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative size-[34px] rounded-full bg-transparent">
          <Avatar className="size-[34px]">
            <AvatarImage
              src={user.user_metadata.avatar_url || "/placeholder.svg"}
              alt={user.user_metadata.full_name ?? "User"}
            />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <span className="sr-only">User</span>
          <Badge
            size="3xs"
            variant="default"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 leading-none capitalize"
          >
            {userBadgeText}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between gap-1">
            <div className="flex flex-col space-y-1">
              <p className="max-w-[200px] truncate text-sm leading-none font-medium text-ellipsis">
                {user.user_metadata.full_name}
              </p>
              <p className="text-muted-foreground max-w-[200px] truncate text-xs leading-none text-wrap text-ellipsis">
                {user.email}
              </p>
            </div>

            <Button variant="outline" size="icon-sm" asChild>
              <Link href="https://github.com/kiko-g" target="_blank" rel="noopener noreferrer">
                <GithubIcon />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm leading-none font-medium"></p>
          </div>
          Preferences
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Button
            variant="dropdown-item"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full"
          >
            {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            <span className="w-full text-left">{theme === "dark" ? "Light" : "Dark"} Theme</span>
          </Button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/favorites">
            <HeartIcon className="h-4 w-4" />
            <span>Favorites</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={signOut}>
          <DropdownMenuItem variant="destructive" asChild>
            <Button variant="dropdown-item" type="submit" className="w-full">
              <LogOut className="h-4 w-4" />
              <span className="w-full text-left">Sign Out</span>
            </Button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
