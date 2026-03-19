"use client"

import { useEffect, useState } from "react"
import { ShareIcon, PlusSquareIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PWAIOSGuideProps {
  visible: boolean
  forceDesktop?: boolean
  onClose: () => void
}

const STEPS = [
  {
    num: 1,
    icon: ShareIcon,
    title: "Tap Share",
    desc: (
      <>
        Tap the <ShareIcon className="mb-0.5 inline size-3.5" /> button in Safari&apos;s toolbar
      </>
    ),
  },
  {
    num: 2,
    icon: PlusSquareIcon,
    title: "Add to Home Screen",
    desc: (
      <>
        Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
      </>
    ),
  },
  {
    num: 3,
    icon: null,
    title: "Tap Add",
    desc: (
      <>
        Make sure <strong>&quot;Open as Web App&quot;</strong> is enabled, then tap <strong>Add</strong>
      </>
    ),
  },
] as const

export function PWAIOSGuide({ visible, forceDesktop, onClose }: PWAIOSGuideProps) {
  const [mounted, setMounted] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true))
      })
    } else if (mounted) {
      setAnimateIn(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible, mounted])

  if (!mounted) return null

  return (
    <div
      role="dialog"
      aria-label="How to install Price Lens on iPhone"
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        !forceDesktop && "md:hidden",
        "transition-opacity duration-300",
        animateIn ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        className={cn(
          "bg-background border-border/50 relative mx-2 mb-2 w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl",
          "transition-transform duration-300 ease-out",
          animateIn ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="from-primary/60 via-secondary/60 to-primary/40 absolute inset-x-0 top-0 h-[2px] bg-linear-to-r" />

        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-full p-1 transition-colors"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </button>

        <div className="flex flex-col gap-4 px-5 pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 dark:bg-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/price-lens.svg" alt="" width={24} height={24} className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm leading-tight font-semibold">Install Price Lens</h3>
              <p className="text-muted-foreground text-xs">3 quick steps in Safari</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {num}
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm leading-tight font-medium">{title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* arrow pointing down to Safari toolbar */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <span className="text-muted-foreground text-[10px] tracking-widest uppercase">Share button is below</span>
            <svg className="text-muted-foreground size-5 animate-bounce" fill="none" viewBox="0 0 20 20">
              <path
                d="M10 4v10m0 0l-4-4m4 4l4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <Button onClick={onClose} variant="ghost" size="sm" roundedness="xl" className="self-center">
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
