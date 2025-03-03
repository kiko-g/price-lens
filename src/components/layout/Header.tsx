"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigation, siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

import { GithubIcon } from "../icons"
import { Button } from "@/components/ui/button"
import { LogoLink } from "./LogoLink"
import { ThemeToggle } from "./ThemeToggle"
import { NavigationDrawer } from "./NavigationDrawer"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 mx-auto w-full border-b bg-zinc-100 bg-opacity-60 backdrop-blur-sm backdrop-filter dark:bg-zinc-950 dark:bg-opacity-50 xl:px-4">
      <div className="flex items-center justify-between px-3 py-3 sm:px-3 lg:px-4 xl:px-1">
        <div className="flex items-center gap-3">
          <LogoLink />
          <span className="inline-flex items-center rounded-full bg-gradient-to-br from-indigo-600/70 to-blue-600/70 px-1.5 py-0.5 text-xs/4 font-bold capitalize tracking-tight text-white">
            Early Access
          </span>

          <nav className="ml-3 hidden items-center gap-1.5 md:flex">
            {navigation.map((item) => (
              <Button
                variant="ghost"
                asChild
                className={cn(pathname === item.href && "bg-zinc-200 dark:bg-zinc-100/20")}
                key={item.href}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <ul className="flex items-center justify-center gap-0.5 md:gap-1">
          <Button variant="ghost" size="icon-sm" asChild className="hidden md:inline-flex">
            <Link target="_blank" href={siteConfig.links.repo}>
              <GithubIcon />
            </Link>
          </Button>

          <ThemeToggle />
          <NavigationDrawer />
        </ul>
      </div>
    </header>
  )
}
