"use client"

import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { InstagramIcon, LinkedinIcon, XTwitterIcon } from "@/components/icons"
import { siteConfig } from "@/lib/config"

export function Footer() {
  return (
    <footer className="mx-auto flex w-full items-center justify-between border-t bg-zinc-900 px-4 py-4 pt-4 backdrop-blur-xl sm:px-6 lg:px-8 lg:py-8 lg:pt-8 dark:bg-inherit">
      <div className="flex flex-col items-start justify-start gap-0">
        <p className="text-2xs text-muted-foreground leading-5 md:text-sm">
          Built by{" "}
          <Link
            target="_blank"
            href={siteConfig.links.github}
            className="inline-flex items-center gap-2 font-medium text-white hover:underline hover:opacity-80"
          >
            Francisco Gonçalves
            <Image src="/profile.svg" alt="author" width={24} height={24} className="rounded-full" />
          </Link>
        </p>

        <p className="text-2xs text-muted-foreground leading-5 md:text-sm">
          Code is open source and available on{" "}
          <Link
            target="_blank"
            href={siteConfig.links.repo}
            className="inline-flex items-center gap-2 font-semibold text-white hover:underline hover:opacity-80"
          >
            GitHub
          </Link>
        </p>

        {/* TODO: add decent text to terms and privacy */}
        <div className="text-muted-foreground mt-4 hidden w-full gap-x-4">
          <Link href="/terms" className="text-2xs hover:underline md:text-sm">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-2xs hover:underline md:text-sm">
            Privacy
          </Link>
        </div>
      </div>

      <ul className="flex items-center gap-1">
        <li>
          <Button variant="ghost-dark" size="icon" asChild>
            <Link href={siteConfig.links.instagram} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-4 fill-white" />
            </Link>
          </Button>
        </li>

        <li>
          <Button variant="ghost-dark" size="icon" asChild>
            <Link href={siteConfig.links.twitter} target="_blank" rel="noopener noreferrer">
              <XTwitterIcon className="size-4 fill-white" />
            </Link>
          </Button>
        </li>

        <li>
          <Button variant="ghost-dark" size="icon" asChild>
            <Link href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedinIcon className="size-4 fill-white stroke-transparent text-white" />
            </Link>
          </Button>
        </li>
      </ul>
    </footer>
  )
}
