"use client"

import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/useMediaQuery"

import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"

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
import { useNavigationSheet } from "@/contexts/NavigationSheetContext"
import { ContrastIcon, HeartIcon, LogIn, LogOut, UserIcon } from "lucide-react"

export function UserDropdownMenu() {
  const { user, profile, isLoading } = useUser()
  const { resolvedTheme: theme, setTheme } = useTheme()
  const { openSheet } = useNavigationSheet()

  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isLoading)
    return <Skeleton className="h-10 w-24 shrink-0 rounded-full border md:ml-0 lg:h-9 lg:w-9 lg:rounded-lg" />

  if (!user)
    return isMobile ? (
      <Button
        variant="secondary"
        size="sm"
        className="text-foreground hover:bg-muted/80 border-border/70 bg-muted/45 h-10 gap-2 rounded-full border px-3.5 shadow-none"
        onClick={() => router.push("/login")}
      >
        <LogIn className="size-4 shrink-0" aria-hidden />
        Sign in
      </Button>
    ) : (
      <Button variant="primary" className="relative" onClick={() => router.push("/login")}>
        <span className="hidden md:inline-flex">Sign in</span>
      </Button>
    )

  function getUserBadgeText() {
    if (profile?.role === "admin") return "Admin"
    else if (profile?.plan === "free") return "Free"
    else if (profile?.plan === "plus") return "Plus"
    else return ""
  }

  const userBadgeText = getUserBadgeText()
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U"

  if (isMobile)
    return (
      <button
        type="button"
        onClick={() => openSheet()}
        className="focus-visible:ring-ring relative flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Avatar className="size-9">
          <AvatarImage src={user.user_metadata.avatar_url || "/placeholder.svg"} alt="" />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        <span className="sr-only">{user.user_metadata.full_name ?? "Account menu"}</span>
        <Badge
          size="3xs"
          variant="default"
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 leading-none capitalize"
        >
          {userBadgeText}
        </Badge>
      </button>
    )

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <DropdownMenu modal={false}>
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

        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm leading-none font-medium"></p>
          </div>
          Preferences
        </DropdownMenuLabel>

        <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
          <Button
            variant="dropdown-item"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full"
          >
            <ContrastIcon className="size-4 dark:rotate-180" />
            <span className="w-full text-left">{theme === "dark" ? "Light" : "Dark"} Theme</span>
          </Button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" asChild>
          <Button variant="dropdown-item" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4" />
            <span className="w-full text-left">Sign Out</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
