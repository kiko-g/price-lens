"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { PanelLeftCloseIcon, PanelLeftOpenIcon, WorkflowIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { navigation } from "@/lib/config"
import { APP_SIDEBAR_COOKIE } from "@/lib/app-shell"
import { useIsAdmin } from "@/contexts/UserContext"
import { useBrand } from "@/contexts/BrandContext"

import { LogoLink } from "@/components/layout/LogoLink"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageToggle } from "@/components/layout/LanguageToggle"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type AppSidebarProps = {
  /** Read from the cookie on the server so the first paint matches the persisted state. */
  defaultCollapsed?: boolean
}

/**
 * Desktop (lg+) app shell sidebar. Mobile keeps the bottom nav + navigation sheet.
 * Sticky, full-height, collapsible to an icon rail; the state is persisted in a cookie.
 */
export function AppSidebar({ defaultCollapsed = false }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const isAdmin = useIsAdmin()
  const brand = useBrand()
  const tNav = useTranslations("nav")
  const tSidebar = useTranslations("layout.sidebar")

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${APP_SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
  }

  const items = navigation.filter((item) => item.shownOnDesktop)

  return (
    <aside
      data-collapsed={collapsed ? "" : undefined}
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r pt-[env(safe-area-inset-top,0px)] transition-[width] duration-200 ease-linear lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex h-(--header-height) items-center gap-2 px-3", collapsed && "justify-center px-0")}>
        <LogoLink markOnly={collapsed} className={cn(!collapsed && "flex-1 px-1 md:justify-start")} />
        {!collapsed && <SidebarToggle collapsed={collapsed} onToggle={handleToggle} label={tSidebar("collapse")} />}
      </div>

      <nav aria-label={tSidebar("primary")} className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const href = item.href.split("?")[0]
          const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={tNav(item.key)}
              isActive={isActive}
              collapsed={collapsed}
            />
          )
        })}

        {isAdmin && (
          <div className="mt-4 flex flex-col gap-0.5">
            {!collapsed && <SidebarSectionLabel>{tSidebar("staff")}</SidebarSectionLabel>}
            <SidebarItem
              href="/admin"
              icon={WorkflowIcon}
              label={tNav("admin")}
              isActive={pathname.startsWith("/admin")}
              collapsed={collapsed}
            />
          </div>
        )}
      </nav>

      <div className={cn("border-sidebar-border flex flex-col gap-2 border-t p-2", collapsed && "items-center")}>
        {collapsed ? (
          <>
            <SidebarToggle collapsed={collapsed} onToggle={handleToggle} label={tSidebar("expand")} />
            <ThemeToggle size="icon" variant="ghost" />
          </>
        ) : (
          <>
            <SidebarSectionLabel>{tSidebar("preferences")}</SidebarSectionLabel>
            <div className="flex items-center justify-between gap-2 px-1">
              <LanguageToggle variant="compact" />
              <ThemeToggle size="icon" variant="ghost" />
            </div>
            <p className="text-muted-foreground truncate px-1 pt-1 text-[11px] leading-snug">{brand.taglineText}</p>
          </>
        )}
      </div>
    </aside>
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
      className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
    >
      <Icon className="size-4" />
    </button>
  )
}

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">
      {children}
    </span>
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
        "flex h-10 items-center gap-3 rounded-lg text-sm transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("size-4.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
