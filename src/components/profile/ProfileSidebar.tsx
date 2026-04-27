"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useLocale, useTranslations } from "next-intl"
import { useFavoritesCount } from "@/hooks/useFavorites"
import { isLocale, type Locale } from "@/i18n/config"
import { formatDate } from "@/lib/i18n/format"

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

export function ProfileSidebar({ user, profile }: ProfileSidebarProps) {
  const { count: favoritesCount } = useFavoritesCount(user.id)
  const t = useTranslations("profile.sidebar")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  const avatarUrl = user.user_metadata?.avatar_url?.replace(/=s96-c/, "=s400-c")
  const username = user.user_metadata?.full_name || t("fallbackName")
  const userInitial = user.email ? user.email[0].toUpperCase() : "U"
  const provider = user?.app_metadata?.provider
  const memberSinceFormatted = formatDate(new Date(user.created_at), locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const quickLinks = [
    { key: "browseProducts" as const, href: "/products", icon: PackageSearchIcon },
    { key: "myFavorites" as const, href: "/favorites", icon: HeartIcon },
  ]

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
            <span>{t("favoritesLabel")}</span>
          </div>
          <div className="bg-border h-8 w-px" />
          <div className="flex flex-col items-center">
            <span className="text-foreground text-base font-bold">{t("statZero")}</span>
            <span>{t("listsLabel")}</span>
          </div>
          <div className="bg-border h-8 w-px" />
          <div className="flex flex-col items-center">
            <span className="text-foreground text-base font-bold">{t("statZero")}</span>
            <span>{t("alertsLabel")}</span>
          </div>
        </div>

        <p className="text-muted-foreground mt-2 text-xs">
          {t.rich("memberSince", {
            date: memberSinceFormatted,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
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
              {t(link.key)}
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
              {t.rich("favoritesAndMember", {
                count: t("favoritesShort", { count: favoritesCount }),
                date: memberSinceFormatted,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
