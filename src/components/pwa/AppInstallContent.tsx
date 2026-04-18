"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  DownloadIcon,
  ShareIcon,
  PlusSquareIcon,
  SmartphoneIcon,
  CheckCircle2Icon,
  MonitorIcon,
  ChromeIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { BeforeInstallPromptEvent } from "@/hooks/usePWAInstall"

type Platform = "android" | "ios" | "desktop"

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop"
  const ua = navigator.userAgent
  if (/iP(hone|od|ad)/.test(ua) && /WebKit/.test(ua)) return "ios"
  if (/Android/.test(ua)) return "android"
  return "desktop"
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function AppInstallContent() {
  const [platform, setPlatform] = useState<Platform>("desktop")
  const [installed, setInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const t = useTranslations("pwa.appPage")
  const tIos = useTranslations("pwa.appPage.ios")
  const tAndroid = useTranslations("pwa.appPage.android")
  const tDesktop = useTranslations("pwa.appPage.desktop")

  useEffect(() => {
    setPlatform(getPlatform())
    if (isStandalone()) setInstalled(true)

    const handlePrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
    }
    const handleInstalled = () => setInstalled(true)

    window.addEventListener("beforeinstallprompt", handlePrompt)
    window.addEventListener("appinstalled", handleInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    setInstalling(true)
    const { outcome } = await prompt.prompt()
    if (outcome === "accepted") setInstalled(true)
    deferredPrompt.current = null
    setInstalling(false)
  }, [])

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <section className="w-full px-4 pt-12 pb-6 md:pt-16 lg:pt-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 dark:bg-primary/15 flex size-16 items-center justify-center rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/price-lens.svg" alt="" width={36} height={36} className="size-9" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t("title")}</h1>
          </div>

          <p className="text-muted-foreground max-w-lg text-sm md:text-base/relaxed">
            {t.rich("subtitle", { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>

          {installed && (
            <div className="bg-primary/10 text-primary mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <CheckCircle2Icon className="size-4" />
              {t("alreadyInstalled")}
            </div>
          )}
        </div>
      </section>

      {/* platform-specific instructions */}
      <section className="w-full px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {/* ios */}
          <InstructionCard
            id="ios"
            title={tIos("title")}
            icon={SmartphoneIcon}
            expanded={platform === "ios"}
            className={platform === "ios" ? "order-first" : ""}
            steps={[
              tIos.rich("step1", { strong: (c) => <strong>{c}</strong> }),
              tIos.rich("step2", {
                strong: (c) => <strong>{c}</strong>,
                icon: () => <ShareIcon className="mb-0.5 inline size-3.5" />,
              }),
              tIos.rich("step3", { strong: (c) => <strong>{c}</strong> }),
              tIos.rich("step4", {
                strong: (c) => <strong>{c}</strong>,
                icon: () => <PlusSquareIcon className="mb-0.5 inline size-3.5" />,
              }),
            ]}
          />

          {/* android / chromium */}
          <InstructionCard
            id="android"
            title={tAndroid("title")}
            icon={ChromeIcon}
            expanded={platform === "android"}
            className={platform === "android" ? "order-first" : ""}
            installButton={
              !installed &&
              platform === "android" && (
                <Button onClick={handleInstall} disabled={installing || !deferredPrompt.current} className="w-full">
                  <DownloadIcon className="size-4" />
                  {installing ? t("installing") : t("installNow")}
                </Button>
              )
            }
            steps={[
              tAndroid.rich("step1", { strong: (c) => <strong>{c}</strong> }),
              tAndroid.rich("step2", { strong: (c) => <strong>{c}</strong> }),
              tAndroid.rich("step3", { strong: (c) => <strong>{c}</strong> }),
            ]}
          />

          {/* desktop */}
          <InstructionCard
            id="desktop"
            title={tDesktop("title")}
            icon={MonitorIcon}
            expanded={platform === "desktop"}
            className={platform === "desktop" ? "order-first" : ""}
            installButton={
              !installed &&
              platform === "desktop" && (
                <Button onClick={handleInstall} disabled={installing || !deferredPrompt.current} className="w-full">
                  <DownloadIcon className="size-4" />
                  {installing ? t("installing") : t("installNow")}
                </Button>
              )
            }
            steps={[
              tDesktop.rich("step1", { strong: (c) => <strong>{c}</strong> }),
              tDesktop.rich("step2", { strong: (c) => <strong>{c}</strong> }),
            ]}
          />
        </div>
      </section>
    </main>
  )
}

function InstructionCard({
  id,
  title,
  icon: Icon,
  steps,
  expanded,
  installButton,
  className,
}: {
  id: string
  title: string
  icon: React.ElementType
  steps: React.ReactNode[]
  expanded: boolean
  installButton?: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(expanded)

  return (
    <div className={cn("border-border/50 overflow-hidden rounded-xl border", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-accent/40 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
        aria-expanded={open}
        aria-controls={`install-${id}`}
      >
        <Icon className="text-muted-foreground size-5 shrink-0" />
        <span className="flex-1 text-sm font-medium">{title}</span>
        <svg
          className={cn("text-muted-foreground size-4 transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={`install-${id}`}
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
            {installButton}
            <ol className="flex flex-col gap-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-muted-foreground pt-0.5 text-sm leading-snug">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
