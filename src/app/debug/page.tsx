"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toPng } from "html-to-image"
import { AxiosError } from "axios"
import type { ErrorReason } from "@/lib/errors"

import { Button } from "@/components/ui/button"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"

import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"
import { OpenFoodFactsLogo } from "@/components/icons/OpenFoodFacts"

import {
  HeartIcon,
  ScaleIcon,
  BrainCogIcon,
  SearchIcon,
  ShoppingCartIcon,
  PackageIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  CheckIcon,
  CheckCircleIcon,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Fake errors that mimic real Axios / JS errors for each ErrorReason
// ---------------------------------------------------------------------------

function makeFakeAxiosError(opts: { code?: string; status?: number; message?: string }): AxiosError {
  const error = new AxiosError(opts.message ?? "Request failed", opts.code)
  if (opts.status) {
    error.response = { status: opts.status, data: {}, headers: {}, statusText: "", config: {} as never }
  }
  return error
}

const FAKE_ERRORS: Record<ErrorReason, unknown> = {
  timeout: makeFakeAxiosError({ code: "ECONNABORTED", message: "timeout of 15000ms exceeded" }),
  network: makeFakeAxiosError({ code: "ERR_NETWORK", message: "Network Error" }),
  unavailable: makeFakeAxiosError({ status: 503, message: "Request failed with status code 503" }),
  rate_limit: makeFakeAxiosError({ status: 429, message: "Request failed with status code 429" }),
  unknown: new Error("Something unexpected happened"),
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-border rounded-lg border">
      <button
        type="button"
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-3 text-left font-semibold transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
        {title}
      </button>
      {open && <div className="border-border space-y-6 border-t px-4 py-6">{children}</div>}
    </div>
  )
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
      {children}
    </div>
  )
}

function SplashPreview({ mode }: { mode: "light" | "dark" }) {
  const isDark = mode === "dark"

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border"
      style={{
        height: 400,
        background: isDark ? "#09090b" : "#fff",
      }}
    >
      <div className="flex flex-col items-center gap-5 p-4" style={{ animation: "__sf .6s ease-out both" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/price-lens.svg"
          alt=""
          width={64}
          height={64}
          style={{ filter: "drop-shadow(0 0 24px rgba(99,106,215,.4))" }}
        />
        <span
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            letterSpacing: "-.025em",
            color: isDark ? "#fafafa" : "#1c1917",
            fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
          }}
        >
          Price Lens
        </span>
      </div>

      {/* Loading bar */}
      <div
        style={{
          position: "absolute",
          bottom: "3rem",
          width: 40,
          height: 3,
          borderRadius: 9999,
          overflow: "hidden",
          background: isDark ? "rgba(250,250,249,.1)" : "rgba(28,25,23,.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 9999,
            background: isDark ? "rgba(99,106,215,.8)" : "rgba(99,106,215,.6)",
            animation: "__sl 1.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  )
}

const BANNER_W = 1584
const BANNER_H = 396

const LINKEDIN_KPIS = [
  { value: "126k+", label: "products tracked" },
  { value: "€79k+", label: "in savings across catalog" },
  { value: "17k+", label: "on discount" },
  { value: "~29k", label: "daily price checks" },
  // { value: "2k+", label: "daily price changes" },
  // { value: "192k+", label: "price points" },
]

const LINKEDIN_TRACKING_TEXT = "Tracking since Mar/2025. Data as of Feb/2026."

function LinkedInBanner() {
  const ref = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    if (!ref.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(ref.current, {
        width: BANNER_W,
        height: BANNER_H,
        pixelRatio: 1,
        cacheBust: true,
        skipFonts: true,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = "price-lens-linkedin-banner.png"
      a.click()
    } finally {
      setDownloading(false)
    }
  }, [])

  return (
    <div className="space-y-3">
      {/* Scaled-down preview wrapper */}
      <div className="border-border overflow-hidden rounded-lg border">
        <div
          style={{
            transform: `scale(${1 / 2})`,
            transformOrigin: "top left",
            width: BANNER_W / 2,
            height: BANNER_H / 2,
          }}
        >
          {/* Actual banner at native resolution */}
          <div
            ref={ref}
            style={{ width: BANNER_W, height: BANNER_H, fontFamily: "'Inter', system-ui, sans-serif" }}
            className="relative overflow-hidden bg-[#08080a]"
          >
            {/* Ambient glow — centered in the content area */}
            <div
              className="pointer-events-none absolute"
              style={{
                top: -180,
                left: 400,
                width: 900,
                height: 600,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(99,106,215,0.11) 0%, rgba(59,138,236,0.04) 50%, transparent 70%)",
              }}
            />
            <div
              className="pointer-events-none absolute"
              style={{
                bottom: -100,
                right: 200,
                width: 500,
                height: 400,
                borderRadius: "50%",
                background: "radial-gradient(ellipse at center, rgba(99,106,215,0.06) 0%, transparent 60%)",
              }}
            />

            {/* Subtle grid */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-[50px] right-0 left-0 h-px bg-white/3" />
              <div className="absolute right-0 bottom-[50px] left-0 h-px bg-white/3" />
              <div className="absolute top-0 bottom-0 left-[320px] w-px bg-white/3" />
              <div className="absolute top-0 bottom-0 left-[792px] w-px bg-white/3" />
              <div className="absolute top-0 right-[120px] bottom-0 w-px bg-white/3" />
            </div>

            {/*
              LinkedIn safe zone considerations:
              - Left ~300px: profile photo overlaps bottom-left
              - Top-right ~60px: edit pencil button
              - Bottom ~20px: can get clipped on some viewports
              Content is centered in the right ~75% of the banner.
            */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingLeft: 360, paddingRight: 120 }}
            >
              <div className="flex items-center gap-10">
                {/* Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/price-lens.svg"
                  alt=""
                  width={96}
                  height={96}
                  className="shrink-0"
                  style={{ filter: "drop-shadow(0 0 36px rgba(99,106,215,0.4))" }}
                />

                {/* Divider */}
                <div className="h-28 w-px shrink-0 bg-white/8" />

                {/* Brand + subtitle */}
                <div className="flex shrink-0 flex-col">
                  <h1
                    className="font-semibold text-white"
                    style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.045em" }}
                  >
                    Price Lens
                  </h1>
                  <p
                    className="mt-2 text-zinc-400"
                    style={{ fontSize: 20, letterSpacing: "-0.015em", lineHeight: 1.3 }}
                  >
                    Price tracking for Portuguese supermarkets
                  </p>
                  <p className="mt-1 text-zinc-500" style={{ fontSize: 15, letterSpacing: "-0.01em" }}>
                    Continente · Auchan · Pingo Doce
                  </p>
                </div>

                {/* Divider */}
                <div className="h-24 w-px shrink-0 bg-white/6" />

                <div className="flex flex-col gap-4">
                  {/* KPIs — 3x2 grid */}
                  <div className="grid shrink-0 grid-cols-2 gap-2">
                    {LINKEDIN_KPIS.map((kpi) => (
                      <div
                        key={kpi.label}
                        className="flex flex-col items-center rounded-lg px-4 py-2.5"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", minWidth: 118 }}
                      >
                        <span
                          className="font-semibold text-white"
                          style={{ fontSize: 20, letterSpacing: "-0.03em", lineHeight: 1 }}
                        >
                          {kpi.value}
                        </span>
                        <span className="mt-1 text-zinc-500" style={{ fontSize: 11 }}>
                          {kpi.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-zinc-200" style={{ fontSize: 13 }}>
                    <CheckCircleIcon className="mr-1 inline size-3.5 text-emerald-400" />
                    {LINKEDIN_TRACKING_TEXT}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {BANNER_W} x {BANNER_H}px · 4.0:1
        </p>
        <Button size="sm" onClick={handleDownload} disabled={downloading}>
          <DownloadIcon className="size-3.5" />
          {downloading ? "Downloading…" : "Download PNG"}
        </Button>
      </div>
    </div>
  )
}

function OGPreview({ src, filename, width, height }: { src: string; filename: string; width: number; height: number }) {
  const [imgSrc, setImgSrc] = useState(src)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setImgSrc(`${src}?t=${Date.now()}`)
  }, [src])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(imgSrc)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted/30 border-border overflow-hidden rounded-lg border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={filename} className="block w-full" style={{ aspectRatio: `${width}/${height}` }} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {width} x {height}px · {(width / height).toFixed(1)}:1
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImgSrc(`${src}?t=${Date.now()}`)}>
            Refresh
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            <DownloadIcon className="size-3.5" />
            {downloading ? "Downloading…" : "Download PNG"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DebugPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UI Showcase</h1>
        <p className="text-muted-foreground text-sm">Preview components and states without breaking the app.</p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* OG / Social Images */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Social Images" defaultOpen={true}>
        <div className="grid gap-8">
          <Subsection label="linkedin banner (4:1)">
            <LinkedInBanner />
          </Subsection>
          <Subsection label="og image — with stats (1.9:1)">
            <OGPreview src="/og?stats=true" filename="price-lens-og-stats.png" width={1200} height={630} />
          </Subsection>
          <Subsection label="og image — default (1.9:1)">
            <OGPreview
              src="/og?title=Price+Lens&description=Price+tracking+for+Portuguese+supermarkets"
              filename="price-lens-og.png"
              width={1200}
              height={630}
            />
          </Subsection>
        </div>
      </Section>

      <Section title="Debug Tools" defaultOpen={false}>
        <div className="grid gap-6">
          <OpenFoodFactsIcon className="h-6 w-auto" />
          <OpenFoodFactsLogo className="h-10 w-auto" />
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Splash Screen */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Splash Screen (PWA loading state)" defaultOpen={false}>
        <div className="grid gap-6 md:grid-cols-2">
          <Subsection label="light mode">
            <SplashPreview mode="light" />
          </Subsection>
          <Subsection label="dark mode">
            <SplashPreview mode="dark" />
          </Subsection>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Error States */}
      {/* ----------------------------------------------------------------- */}
      <Section title="ErrorStateView:  by error reason" defaultOpen={false}>
        <div className="grid gap-6">
          {(Object.keys(FAKE_ERRORS) as ErrorReason[]).map((reason) => (
            <Subsection key={reason} label={reason}>
              <ErrorStateView error={FAKE_ERRORS[reason]} onRetry={() => alert(`Retry: ${reason}`)} />
            </Subsection>
          ))}

          <Subsection label="no error prop (fallback)">
            <ErrorStateView onRetry={() => alert("Retry: fallback")} />
          </Subsection>

          <Subsection label="without retry button">
            <ErrorStateView error={FAKE_ERRORS.timeout} />
          </Subsection>

          <Subsection label="custom title override">
            <ErrorStateView
              error={FAKE_ERRORS.unavailable}
              title="Failed to load price comparison"
              onRetry={() => {}}
            />
          </Subsection>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Empty States */}
      {/* ----------------------------------------------------------------- */}
      <Section title="EmptyStateView:  various contexts">
        <div className="grid gap-6">
          <Subsection label="products:  no search results (with query)">
            <EmptyStateView
              title="No results found"
              message='We couldn&apos;t find any products matching "arroz integral". Try a different search term or clear your filters.'
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Clear filters
                  </Button>
                  <Button variant="outline" size="sm">
                    Return home
                  </Button>
                </div>
              }
            />
          </Subsection>

          <Subsection label="products:  no search results (no query)">
            <EmptyStateView
              title="No results found"
              message="Try adjusting your filters to find what you're looking for."
              actions={
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              }
            />
          </Subsection>

          <Subsection label="favorites:  empty">
            <EmptyStateView
              icon={HeartIcon}
              title="No favorites yet"
              message="Start adding products to your favorites to see them here."
              actions={
                <Button variant="outline" size="sm">
                  <SearchIcon className="size-4" />
                  Find products
                </Button>
              }
            />
          </Subsection>

          <Subsection label="favorites:  no search match">
            <EmptyStateView
              icon={HeartIcon}
              title="No favorites match your search"
              message='We couldn&apos;t find any favorites matching "leite".'
              actions={
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              }
            />
          </Subsection>

          <Subsection label="compare prices:  none available">
            <EmptyStateView
              icon={ScaleIcon}
              title="No price comparisons available"
              message="We couldn't find this product listed at other stores right now. Check back later as availability updates regularly."
            />
          </Subsection>

          <Subsection label="related products:  none found">
            <EmptyStateView
              title="No related products found"
              message="We couldn't find related products for this item right now. Check back later as our catalog updates regularly."
            />
          </Subsection>

          <Subsection label="identical cross-store:  none">
            <EmptyStateView
              icon={BrainCogIcon}
              title="No identical products found"
              message="We couldn't find this product in other stores right now."
            />
          </Subsection>

          <Subsection label="cart (hypothetical)">
            <EmptyStateView
              icon={ShoppingCartIcon}
              title="Your cart is empty"
              message="Browse products and add items to get started."
              actions={
                <Button variant="outline" size="sm">
                  <PackageIcon className="size-4" />
                  Browse products
                </Button>
              }
            />
          </Subsection>

          <Subsection label="minimal:  title only">
            <EmptyStateView title="Nothing here" />
          </Subsection>
        </div>
      </Section>
    </div>
  )
}
