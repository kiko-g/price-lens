"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  ScanSearchIcon,
  BellRingIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react"

const steps = [
  {
    step: "01",
    icon: ScanSearchIcon,
    title: "We track daily prices",
    description:
      "Every day, Price Lens scans major Portuguese supermarkets — Continente, Auchan, and Pingo Doce — to record current prices on thousands of essential products.",
  },
  {
    step: "02",
    icon: BellRingIcon,
    title: "We detect silent hikes",
    description:
      "Our system flags price changes, even the tiny ones. A 2-cent increase on tuna might seem harmless, but compounded across months it adds up fast.",
  },
  {
    step: "03",
    icon: ShieldCheckIcon,
    title: "You stay informed",
    description:
      "Browse price histories, compare across stores, and track your essentials. No more paying more without knowing — you see exactly what changed and when.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="glass-primary" size="md">
            <SparklesIcon className="size-3.5" />
            How it works
          </Badge>

          <h2 className="max-w-3xl text-3xl font-bold tracking-tighter text-balance sm:text-4xl md:text-5xl">
            Price transparency in three steps
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            No complicated setup, no subscriptions required. Just open, explore, and start understanding how prices
            really move.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:mt-14">
          {steps.map((step) => (
            <Card key={step.step} className="relative overflow-hidden border">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                    Step {step.step}
                  </span>
                </div>

                <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex justify-center md:mt-14">
          <Button variant="marketing-default" size="lg" asChild>
            <Link href="/products">
              Start exploring prices
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
