"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type { LucideIcon } from "lucide-react"
import {
  DatabaseIcon,
  CrownIcon,
  RefreshCwIcon,
  SparklesIcon,
  FlaskConicalIcon,
  CalendarClockIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  ChevronDown,
  ChevronUp,
  HomeIcon,
  ShoppingBasketIcon,
  HeartIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  ScanFaceIcon,
  MoreHorizontalIcon,
  ActivityIcon,
  TestTube2Icon,
  PieChartIcon,
  ClockIcon,
  LayoutDashboardIcon,
  MapIcon,
} from "lucide-react"

import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  items?: { title: string; href: string; icon?: LucideIcon }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Schedule",
    href: "/admin/schedule",
    icon: CalendarClockIcon,
    items: [
      { title: "Overview", href: "/admin/schedule", icon: LayoutDashboardIcon },
      { title: "Activity", href: "/admin/schedule/activity", icon: ActivityIcon },
      { title: "Distribution", href: "/admin/schedule/distribution", icon: PieChartIcon },
      { title: "Timeline", href: "/admin/schedule/timeline", icon: ClockIcon },
      { title: "Test", href: "/admin/schedule/test", icon: TestTube2Icon },
    ],
  },
  {
    title: "Discovery",
    href: "/admin/discovery",
    icon: MapIcon,
  },
  {
    title: "Database",
    href: "/admin/dashboard",
    icon: DatabaseIcon,
    items: [
      { title: "Prices", href: "/admin/dashboard/prices", icon: DollarSignIcon },
      { title: "Products", href: "/admin/dashboard/products", icon: PackageIcon },
      { title: "Store Products", href: "/admin/dashboard/store_products", icon: ShoppingCartIcon },
    ],
  },
  {
    title: "Priorities",
    href: "/admin/priorities",
    icon: CrownIcon,
  },
  {
    title: "Bulk Re-Scrape",
    href: "/admin/bulk-scrape",
    icon: RefreshCwIcon,
  },
  {
    title: "AI Classifier",
    href: "/admin/priorities/ai",
    icon: SparklesIcon,
  },
  {
    title: "Test Scrapers",
    href: "/admin/test",
    icon: FlaskConicalIcon,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SiteNavigationDropup />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>Utilities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) =>
                item.items ? (
                  <CollapsibleNavItem key={item.href} item={item} pathname={pathname} />
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <UserDropup />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || item.items?.some((sub) => pathname === sub.href)

  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={pathname === item.href}>
            <item.icon />
            <span>{item.title}</span>
            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                  <Link href={subItem.href}>
                    {subItem.icon && <subItem.icon className="size-4" />}
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SITE_NAV_ITEMS = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Products", href: "/products?priority_order=true", icon: ShoppingBasketIcon },
  { title: "Favorites", href: "/favorites", icon: HeartIcon },
]

function SiteNavigationDropup() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip="Go to Site"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          {/* TODO: fix here. when collapsed the icon is not centered */}
          <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-r from-blue-500 to-blue-600"></span>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">PriceLens</span>
            <span className="text-muted-foreground truncate text-xs">Admin Dashboard</span>
          </div>
          <ChevronUp className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]" align="start" sideOffset={4}>
        <DropdownMenuLabel>Navigate to</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SITE_NAV_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center gap-2">
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserDropup() {
  const { user, profile, isLoading } = useUser()
  const { resolvedTheme: theme, setTheme } = useTheme()
  const router = useRouter()

  if (isLoading) {
    return (
      <SidebarMenuButton size="lg" className="pointer-events-none">
        <Skeleton className="size-8 rounded-lg" />
        <div className="grid flex-1 gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </SidebarMenuButton>
    )
  }

  if (!user) {
    return (
      <SidebarMenuButton size="lg" tooltip="Sign In" onClick={() => router.push("/login")}>
        <span className="flex size-8 items-center justify-center rounded-lg border">
          <ScanFaceIcon className="size-4" />
        </span>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">Guest</span>
          <span className="text-muted-foreground truncate text-xs">Sign in to continue</span>
        </div>
      </SidebarMenuButton>
    )
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U"

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip={user.user_metadata.full_name || user.email}
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name ?? "User"} />
            <AvatarFallback className="rounded-lg">{userInitial}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.user_metadata.full_name}</span>
            <span className="text-muted-foreground truncate text-xs">{profile?.role || "User"}</span>
          </div>
          <MoreHorizontalIcon className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]" align="end" sideOffset={4}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user.user_metadata.full_name}</p>
            <p className="text-muted-foreground text-xs leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <UserIcon className="size-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favorites" className="flex items-center gap-2">
            <HeartIcon className="size-4" />
            <span>Favorites</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          <span>{theme === "dark" ? "Light" : "Dark"} Theme</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOutIcon className="size-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
