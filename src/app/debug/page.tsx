"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toPng } from "html-to-image"

import { Button } from "@/components/ui/button"
import { ChevronDownIcon, ChevronRightIcon, DownloadIcon, CheckCircleIcon } from "lucide-react"

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
    <div>
      <button
        type="button"
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-3 text-left font-semibold transition-colors active:scale-100"
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

const BANNER_W = 1600
const BANNER_H = 400

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

  const [preview, setPreview] = useState<string | null>(null)

  const capture = useCallback(async () => {
    if (!ref.current) return
    const url = await toPng(ref.current, {
      width: BANNER_W,
      height: BANNER_H,
      pixelRatio: 1,
      cacheBust: true,
      skipFonts: true,
    })
    setPreview(url)
  }, [])

  useEffect(() => {
    const t = setTimeout(capture, 300)
    return () => clearTimeout(t)
  }, [capture])

  return (
    <div className="space-y-3">
      {/* Hidden native-res banner for capture */}
      <div className="pointer-events-none fixed -top-[9999px] left-0 opacity-0" aria-hidden>
        <div
          ref={ref}
          style={{ width: BANNER_W, height: BANNER_H, fontFamily: "'Inter', system-ui, sans-serif" }}
          className="relative overflow-hidden bg-[#08080a]"
        >
          {/* Ambient glow */}
          <div
            className="absolute"
            style={{
              top: -180,
              left: 400,
              width: 900,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(99,106,215,0.11) 20%, rgba(59,138,236,0.04) 50%, transparent 70%)",
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: -100,
              right: 200,
              width: 500,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, rgba(99,106,215,0.06) 0%, transparent 60%)",
            }}
          />

          {/* Grid */}
          <div className="absolute inset-0">
            <div className="absolute top-[50px] right-0 left-0 h-px bg-white/3" />
            <div className="absolute right-0 bottom-[50px] left-0 h-px bg-white/3" />
            <div className="absolute top-0 bottom-0 left-[320px] w-px bg-white/3" />
            <div className="absolute top-0 bottom-0 left-[792px] w-px bg-white/3" />
            <div className="absolute top-0 right-[120px] bottom-0 w-px bg-white/3" />
          </div>

          {/* Content */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ paddingLeft: 360, paddingRight: 120 }}
          >
            <div className="flex items-center gap-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/price-lens.svg"
                alt=""
                width={96}
                height={96}
                className="shrink-0"
                style={{ filter: "drop-shadow(0 0 36px rgba(99,106,215,0.4))" }}
              />
              <div className="h-28 w-px shrink-0 bg-white/8" />
              <div className="flex shrink-0 flex-col">
                <h1
                  className="font-semibold text-white"
                  style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.045em" }}
                >
                  Price Lens
                </h1>
                <p className="mt-2 text-zinc-400" style={{ fontSize: 20, letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                  Price tracking for Portuguese supermarkets
                </p>
                <p className="mt-1 text-zinc-500" style={{ fontSize: 15, letterSpacing: "-0.01em" }}>
                  Continente · Auchan · Pingo Doce
                </p>
              </div>
              <div className="h-24 w-px shrink-0 bg-white/6" />
              <div className="flex flex-col gap-4">
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

      {/* Visible preview as a regular image */}
      <div className="border-border overflow-hidden rounded-lg border">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="LinkedIn banner preview"
            className="block w-full"
            style={{ aspectRatio: `${BANNER_W}/${BANNER_H}` }}
          />
        ) : (
          <div
            className="bg-muted/30 flex items-center justify-center"
            style={{ aspectRatio: `${BANNER_W}/${BANNER_H}` }}
          >
            <p className="text-muted-foreground text-sm">Generating preview…</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {BANNER_W} x {BANNER_H}px · 4.0:1
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={capture}>
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
    </div>
  )
}
