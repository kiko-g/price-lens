"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { InstagramIcon, LinkedinIcon, XTwitterIcon } from "@/components/icons"

export function Footer({ className }: { className?: string }) {
  const t = useTranslations("layout.footerFull")
  return (
    <footer
      className={cn(
        "mx-auto hidden w-full items-center justify-between border-t bg-zinc-50 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xl sm:px-6 lg:flex lg:px-8 lg:pt-8 lg:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] dark:bg-inherit",
        className,
      )}
    >
      <div className="flex flex-col items-start justify-start gap-0">
        <p className="text-2xs text-muted-foreground leading-5 md:text-sm">
          {t.rich("builtBy", {
            link: (chunks) => (
              <Link
                target="_blank"
                href={siteConfig.links.github}
                className="inline-flex items-center gap-2 font-medium text-zinc-900 hover:underline hover:opacity-80 dark:text-white"
              >
                {chunks}
                <Image src="/profile.svg" alt="" width={24} height={24} className="rounded-full" />
              </Link>
            ),
          })}
        </p>

        <p className="text-2xs text-muted-foreground leading-5 md:text-sm">
          {t.rich("openSource", {
            link: (chunks) => (
              <Link
                target="_blank"
                href={siteConfig.links.repo}
                className="inline-flex items-center gap-2 font-semibold text-zinc-900 hover:underline hover:opacity-80 dark:text-white"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        <div className="text-muted-foreground mt-4 hidden w-full gap-x-4">
          <Link href="/terms" className="text-2xs hover:underline md:text-sm">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="text-2xs hover:underline md:text-sm">
            {t("privacy")}
          </Link>
        </div>
      </div>

      <ul className="flex items-center gap-1">
        <li>
          <Button variant="ghost-dark" size="icon" asChild>
            <Link href={siteConfig.links.instagram} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-4 fill-zinc-900 dark:fill-white" />
            </Link>
          </Button>
        </li>

        <li>
          <Button variant="ghost-dark" size="icon" asChild>
            <Link href={siteConfig.links.twitter} target="_blank" rel="noopener noreferrer">
              <XTwitterIcon className="size-4 fill-zinc-900 dark:fill-white" />
            </Link>
          </Button>
        </li>

        <li>
          <Button variant="ghost-dark" size="icon" asChild>
            <Link href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedinIcon className="size-4 fill-zinc-900 stroke-transparent dark:fill-white dark:stroke-transparent" />
            </Link>
          </Button>
        </li>
      </ul>
    </footer>
  )
}
