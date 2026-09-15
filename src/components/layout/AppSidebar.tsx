"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { navigation, type NavigationKey } from "@/lib/config"
import { APP_SIDEBAR_COOKIE } from "@/lib/app-shell"
import { useIsAdmin } from "@/contexts/UserContext"
import { useUser } from "@/hooks/useUser"
import { useLivePulse } from "@/hooks/useLivePulse"

import { GlyphAdmin, GlyphProfile } from "@/components/icons/lince-glyphs"
import { LogoLink } from "@/components/layout/LogoLink"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageToggle } from "@/components/layout/LanguageToggle"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const EXPLORE_KEYS = new Set<NavigationKey>(["home", "browse", "deals", "favorites"])

type AppSidebarProps = {
  /** Read from the cookie on the server so the first paint matches the persisted state. */
  defaultCollapsed?: boolean
}

/**
 * Desktop (lg+) app shell sidebar — the Lince HUD. Mobile keeps the bottom nav + navigation sheet.
 * Sticky, full-height, collapsible to an icon rail; state persisted in a cookie.
 */
export function AppSidebar({ defaultCollapsed = false }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const isAdmin = useIsAdmin()
  const { user } = useUser()
  const tNav = useTranslations("nav")
  const tSidebar = useTranslations("layout.sidebar")

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${APP_SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
  }

  const desktopItems = navigation.filter((item) => item.shownOnDesktop)
  const exploreItems = desktopItems.filter((item) => EXPLORE_KEYS.has(item.key))
  const accountItems = desktopItems.filter((item) => !EXPLORE_KEYS.has(item.key))

  const isActive = (href: string) => {
    const clean = href.split("?")[0]
    return clean === "/" ? pathname === "/" : pathname === clean || pathname.startsWith(`${clean}/`)
  }

  return (
    <aside
      data-collapsed={collapsed ? "" : undefined}
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r pt-[env(safe-area-inset-top,0px)] transition-[width] duration-200 ease-linear lg:flex",
        "dark:from-base-900 dark:to-base-950 dark:bg-linear-to-b",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-2 px-4 pt-5 pb-4", collapsed && "justify-center px-0")}>
        <LogoLink
          markOnly={collapsed}
          withEyebrow
          markClassName="size-9"
          className={cn(!collapsed && "flex-1 md:justify-start")}
        />
        {!collapsed && <SidebarToggle collapsed={collapsed} onToggle={handleToggle} label={tSidebar("collapse")} />}
      </div>

      <nav aria-label={tSidebar("primary")} className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pt-2 pb-3">
        <SidebarSection label={tSidebar("explore")} collapsed={collapsed}>
          {exploreItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={tNav(item.key)}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </SidebarSection>

        <SidebarSection label={tSidebar("account")} collapsed={collapsed}>
          <SidebarItem
            href={user ? "/profile" : "/login"}
            icon={GlyphProfile}
            label={tNav("profile")}
            isActive={isActive("/profile")}
            collapsed={collapsed}
          />
          {accountItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={tNav(item.key)}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </SidebarSection>

        {isAdmin && (
          <SidebarSection label={tSidebar("staff")} collapsed={collapsed}>
            <SidebarItem
              href="/admin"
              icon={GlyphAdmin}
              label={tNav("admin")}
              isActive={pathname.startsWith("/admin")}
              collapsed={collapsed}
            />
          </SidebarSection>
        )}
      </nav>

      <div className={cn("flex flex-col gap-3 px-3 pb-3", collapsed && "items-center")}>
        {collapsed ? (
          <>
            <SidebarToggle collapsed={collapsed} onToggle={handleToggle} label={tSidebar("expand")} />
            <ThemeToggle size="icon" variant="ghost" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="eyebrow text-muted-foreground">{tSidebar("preferences")}</span>
              <div className="flex items-center gap-1">
                <LanguageToggle variant="compact" />
                <ThemeToggle size="icon" variant="ghost" />
              </div>
            </div>
            <LivePulseCard />
          </>
        )}
      </div>
    </aside>
  )
}

function LivePulseCard() {
  const tSidebar = useTranslations("layout.sidebar")
  const tFresh = useTranslations("home.freshness")
  const format = useFormatter()
  const { data, isError } = useLivePulse()

  const freshness = resolveFreshness(data?.computedAt ?? null)
  const freshnessLabel =
    freshness.kind === "justNow"
      ? tFresh("justNow")
      : freshness.kind === "hoursAgo"
        ? tFresh("hoursAgo", { hours: freshness.hours })
        : freshness.kind === "today"
          ? tFresh("today")
          : tFresh("recent")

  return (
    <div className="border-sidebar-border bg-card/60 flex flex-col gap-1.5 border p-3">
      <div className="eyebrow text-muted-foreground flex items-center gap-2">
        <span className="relative flex size-1.5">
          <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden" />
          <span className="bg-primary ember-glow relative inline-flex size-1.5 rounded-full" />
        </span>
        {tSidebar("live")}
      </div>
      {isError ? (
        <p className="text-muted-foreground text-xs">{tSidebar("liveUnavailable")}</p>
      ) : data ? (
        <>
          <p className="text-foreground text-xs leading-snug tabular-nums">
            {tSidebar("livePulse", {
              products: format.number(data.totalProducts),
              drops: format.number(data.priceDropsToday),
            })}
          </p>
          <p className="text-muted-foreground text-[11px] leading-none">{freshnessLabel}</p>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="bg-muted h-3 w-40 animate-pulse" />
          <div className="bg-muted h-2.5 w-24 animate-pulse" />
        </div>
      )}
    </div>
  )
}

function resolveFreshness(iso: string | null): { kind: "justNow" | "hoursAgo" | "today" | "recent"; hours: number } {
  if (!iso) return { kind: "recent", hours: 0 }
  const hoursAgo = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
  if (hoursAgo < 1) return { kind: "justNow", hours: 0 }
  if (hoursAgo < 24) return { kind: "hoursAgo", hours: hoursAgo }
  return { kind: "today", hours: hoursAgo }
}

function SidebarSection({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && <span className="eyebrow text-muted-foreground px-3 pb-1.5">{label}</span>}
      {children}
    </div>
  )
}

function SidebarToggle({ collapsed, onToggle, label }: { collapsed: boolean; onToggle: () => void; label: string }) {
  const Icon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center transition-colors"
    >
      <Icon className="size-4" />
    </button>
  )
}

type SidebarItemProps = {
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  isActive: boolean
  collapsed: boolean
}

function SidebarItem({ href, icon: Icon, label, isActive, collapsed }: SidebarItemProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 text-[13.5px] transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {/* ember rail: the HUD "selected" cue */}
      {isActive && <span aria-hidden className="bg-primary ember-glow absolute inset-y-2 -left-3 w-0.5" />}
      <Icon className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
