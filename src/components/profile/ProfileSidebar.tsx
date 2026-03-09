"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useFavoritesCount } from "@/hooks/useFavorites"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

import { HeartIcon, MailIcon, PackageSearchIcon } from "lucide-react"

interface ProfileSidebarProps {
  user: User
  profile: { plan?: string; role?: string } | null
}

function getProviderIcon(provider: string | undefined) {
  switch (provider) {
    case "google":
      return <GoogleIcon />
    default:
      return <MailIcon className="h-4 w-4" />
  }
}

const quickLinks = [
  { label: "Browse Products", href: "/products", icon: PackageSearchIcon },
  { label: "My Favorites", href: "/favorites", icon: HeartIcon },
]

export function ProfileSidebar({ user, profile }: ProfileSidebarProps) {
  const { count: favoritesCount } = useFavoritesCount(user.id)

  const avatarUrl = user.user_metadata?.avatar_url?.replace(/=s96-c/, "=s400-c")
  const username = user.user_metadata?.full_name || "User"
  const userInitial = user.email ? user.email[0].toUpperCase() : "U"
  const provider = user?.app_metadata?.provider
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 flex-col items-center md:flex md:w-64">
        <Avatar className="mx-auto mb-4 h-32 w-32">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
        </Avatar>

        <p className="text-lg font-bold">{username}</p>

        <Badge variant="default" size="xs" className="mt-1 flex items-center gap-1">
          {getProviderIcon(provider)}
          <span className="text-2xs">{user.email}</span>
        </Badge>

        <div className="mt-2 flex items-center gap-2">
          {profile?.plan && (
            <Badge variant="primary" roundedness="sm" className="capitalize">
              {profile.plan}
            </Badge>
          )}
          {profile?.role && (
            <Badge variant="secondary" roundedness="sm" className="capitalize">
              {profile.role}
            </Badge>
          )}
        </div>

        {/* Stats strip */}
        <div className="text-muted-foreground mt-4 flex w-full items-center justify-center gap-3 border-t pt-3 text-center text-xs">
          <div className="flex flex-col items-center">
            <span className="text-foreground text-base font-bold">{favoritesCount}</span>
            <span>Favorites</span>
          </div>
          <div className="bg-border h-8 w-px" />
          <div className="flex flex-col items-center">
            <span className="text-foreground text-base font-bold">0</span>
            <span>Lists</span>
          </div>
          <div className="bg-border h-8 w-px" />
          <div className="flex flex-col items-center">
            <span className="text-foreground text-base font-bold">0</span>
            <span>Alerts</span>
          </div>
        </div>

        <p className="text-muted-foreground mt-2 text-xs">
          Member since <strong>{memberSince}</strong>
        </p>

        {/* Quick links */}
        <nav className="mt-4 flex w-full flex-col gap-1 border-t pt-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile header (visible on small screens) */}
      <div className="flex items-center gap-4 border-b pb-4 md:hidden">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-col">
          <p className="truncate text-base font-bold">{username}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:gap-1.5">
            <div className="flex items-center gap-1">
              {profile?.plan && (
                <Badge variant="primary" size="xs" roundedness="sm" className="w-fit capitalize">
                  {profile.plan}
                </Badge>
              )}

              {profile?.role && (
                <Badge variant="secondary" size="xs" roundedness="sm" className="w-fit capitalize">
                  {profile.role}
                </Badge>
              )}
            </div>

            <span className="text-muted-foreground text-xs">
              <strong>{favoritesCount} favorites</strong> · Member since <strong>{memberSince}</strong>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
