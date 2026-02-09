"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "motion/react"

export function AnimatedPriceCounter() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "0px" })

  const startPrice = 0.59
  const endPrice = 0.89
  const totalMonths = 36
  const monthlyIncrement = (endPrice - startPrice) / totalMonths

  const [currentPrice, setCurrentPrice] = useState(startPrice)
  const [currentMonth, setCurrentMonth] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true)
    }
  }, [isInView, hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    if (currentMonth >= totalMonths) return

    const timeout = setTimeout(() => {
      setCurrentMonth((prev) => prev + 1)
      setCurrentPrice((prev) => {
        const next = prev + monthlyIncrement
        return Math.min(next, endPrice)
      })
    }, 60)

    return () => clearTimeout(timeout)
  }, [hasStarted, currentMonth, monthlyIncrement, totalMonths, endPrice])

  const percentIncrease = ((currentPrice - startPrice) / startPrice) * 100
  const years = Math.floor(currentMonth / 12)
  const months = currentMonth % 12

  const timeLabel =
    years > 0 && months > 0
      ? `${years}y ${months}m`
      : years > 0
        ? `${years}y`
        : months > 0
          ? `${months}m`
          : "0m"

  return (
    <div ref={ref} className="animate-fade-in opacity-0 [--animation-delay:600ms]">
      <div className="border-border bg-card flex flex-col items-center gap-4 rounded-xl border px-6 py-5 shadow-sm md:flex-row md:gap-8 md:px-10 md:py-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Whole milk 1L</span>
          <div className="flex items-baseline gap-1">
            <span className="text-foreground text-4xl font-bold tracking-tighter tabular-nums md:text-5xl">
              {currentPrice.toFixed(2)}
            </span>
            <span className="text-muted-foreground text-lg">EUR</span>
          </div>
        </div>

        <div className="bg-border hidden h-12 w-px md:block" />
        <div className="bg-border block h-px w-full md:hidden" />

        <div className="flex gap-6 text-center md:gap-8">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Time</span>
            <span className="text-foreground text-lg font-semibold tabular-nums">{timeLabel}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Monthly</span>
            <span className="text-foreground text-lg font-semibold tabular-nums">
              +{monthlyIncrement.toFixed(3)} EUR
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Total</span>
            <span className="text-lg font-semibold tabular-nums text-red-500">+{percentIncrease.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-2 text-center text-xs tracking-tight">
        {"+"}
        {monthlyIncrement.toFixed(3)} EUR/month — too small to notice, too big to ignore
      </p>
    </div>
  )
}
