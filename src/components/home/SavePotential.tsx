"use client"

import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"

import { ArrowRight, TrendingUp, Zap, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const AVG_PRICE = 4
const DISCOUNT_RATE = 0.2
const DISCOUNT_CHANCE = 0.6

function calculateSavings(products: number) {
  const monthly = products * DISCOUNT_CHANCE * AVG_PRICE * DISCOUNT_RATE
  return { monthly: Math.round(monthly), yearly: Math.round(monthly * 12) }
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  useEffect(() => {
    const start = display
    const diff = value - start
    if (diff === 0) return
    const duration = 400
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) {
        ref.current = requestAnimationFrame(step)
      }
    }
    ref.current = requestAnimationFrame(step)
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{display}</>
}

function CustomSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const pct = ((value - min) / (max - min)) * 100

  const handlePointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const raw = (clientX - rect.left) / rect.width
      const clamped = Math.min(Math.max(raw, 0), 1)
      const snapped = Math.round((clamped * (max - min)) / step) * step + min
      onChange(snapped)
    },
    [max, min, step, onChange],
  )

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (isDragging.current) handlePointer(e.clientX)
    }
    function onUp() {
      isDragging.current = false
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [handlePointer])

  return (
    <div
      ref={trackRef}
      className="bg-muted relative h-2 w-full cursor-pointer rounded-full"
      onPointerDown={(e) => {
        isDragging.current = true
        handlePointer(e.clientX)
      }}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(value + step, max))
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(value - step, min))
      }}
    >
      {/* Filled track */}
      <div className="bg-primary absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%` }} />
      {/* Thumb */}
      <div
        className="border-primary bg-background absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_12px_hsl(var(--primary-glow)/0.5)] transition-shadow hover:shadow-[0_0_20px_hsl(var(--primary-glow)/0.6)]"
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border p-6 transition-all md:p-8",
        highlight
          ? "border-primary/30 dark:border-primary/30 bg-primary/10 dark:bg-primary/10 shadow-[0_0_40px_-12px_hsl(var(--primary-glow)/0.3)]"
          : "border-border bg-card",
      )}
    >
      <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-lg font-medium", highlight ? "text-primary" : "text-foreground")}>€</span>
        <span
          className={cn(
            "text-5xl font-bold tracking-tight tabular-nums md:text-6xl",
            highlight ? "text-primary" : "text-foreground",
          )}
        >
          <AnimatedNumber value={value} />
        </span>
      </div>

      {highlight && (
        <span className="bg-primary/10 border-primary/30 dark:border-primary/30 dark:bg-primary/20 text-foreground mt-1 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium">
          Just from shopping smarter
        </span>
      )}
    </div>
  )
}

export function SavePotential() {
  const [products, setProducts] = useState(200)
  const { monthly, yearly } = calculateSavings(products)

  return (
    <div className="relative w-full overflow-hidden">
      <section className="w-full overflow-hidden px-4 py-20 md:py-28 lg:py-36">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-12 md:gap-16">
          {/* Badge */}
          <span className="border-primary/30 dark:border-primary/30 bg-primary/10 dark:bg-primary/15 z-2 inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
            <Zap className="text-primary size-4" />
            <span className="text-foreground text-sm font-medium tracking-wide">Smart Shopping Calculator</span>
          </span>

          {/* Heading */}
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 className="text-foreground max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              Stop overpaying.
              <br />
              <span className="text-primary dark:text-primary">Start saving.</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl text-base leading-relaxed text-pretty md:text-lg">
              Most products go on discount at some point. Buy at the right time and the savings compound fast. Drag the
              slider to see your potential.
            </p>
          </div>

          {/* Interactive calculator */}
          <div className="border-border bg-card/60 w-full max-w-3xl rounded-3xl border p-6 backdrop-blur-xl md:p-10">
            {/* Slider section */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <label className="text-foreground text-sm font-medium">Products you buy per month</label>
                <span className="bg-primary rounded-lg px-3 py-1 text-sm font-bold text-white tabular-nums">
                  {products}
                </span>
              </div>

              <CustomSlider min={50} max={500} step={10} value={products} onChange={setProducts} />

              <div className="text-muted-foreground flex justify-between text-xs">
                <span>50 products</span>
                <span>500 products</span>
              </div>
            </div>

            {/* Divider */}
            <div className="bg-border my-8 h-px w-full" />

            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="Saved per month" value={monthly} />
              <StatCard label="Saved per year" value={yearly} highlight />
            </div>

            {/* CTA */}
            <Link
              href="/products"
              className="group bg-primary text-primary-foreground focus-visible:ring-ring focus-visible:ring-offset-background mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Start saving with Price Lens
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-row flex-wrap items-center justify-center gap-4 sm:gap-8">
            {[
              { icon: ShieldCheck, text: "No payment required" },
              { icon: TrendingUp, text: "Average 20% savings" },
              { icon: Zap, text: "Instant price alerts" },
            ].map((item) => (
              <div key={item.text} className="text-muted-foreground flex items-center gap-2 text-sm">
                <item.icon className="text-primary h-4 w-4" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Fine print */}
          <div className="space-y-3">
            <p className="max-w-lg text-center text-base leading-relaxed font-medium">
              Assumes average product price of {`€${AVG_PRICE.toFixed(2)}`}, {`~${(DISCOUNT_CHANCE * 100).toFixed(0)}%`}{" "}
              of products go on sale each month, and an average discount of {`${(DISCOUNT_RATE * 100).toFixed(0)}%`}.
            </p>

            <p className="text-muted-foreground max-w-lg text-center text-sm leading-relaxed font-medium">
              Actual savings depend on regular shopping habits.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
