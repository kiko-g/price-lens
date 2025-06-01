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

import { ShieldEllipsisIcon } from "lucide-react"

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

        <div className="flex items-center justify-center gap-0.5 md:gap-1">
          <Button variant="ghost" size="icon-sm" asChild className="hidden md:inline-flex">
            <Link target="_blank" href={siteConfig.links.repo}>
              <GithubIcon />
            </Link>
          </Button>
          <ThemeToggle />
          <NavigationMenu />
        </div>
      </div>
    </header>
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
