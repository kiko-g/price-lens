"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { TrendingUpIcon, ArrowRightIcon } from "lucide-react"

export function InflationBasket() {
  return (
    <section className="w-full border-t border-indigo-50/80 bg-white bg-linear-to-br from-indigo-50/20 to-indigo-50/20 py-12 md:py-16 lg:py-24 dark:border-transparent dark:bg-zinc-950 dark:from-indigo-300/5 dark:to-indigo-300/5">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Badge className="bg-transparent bg-linear-to-br from-indigo-600/70 to-blue-600/70 text-white dark:text-white">
            <TrendingUpIcon className="h-4 w-4" />
            Inflation depends on basket of selected products
          </Badge>
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Beware of price trends within key products
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
              The inflation basket represents essential products selected by economic authorities to track consumer
              prices. The selection can change over time, but Price Lens keeps an eye on price trends on products that
              matter forever. Who doesn&apos;t care about the price of{" "}
              <span className="font-medium text-indigo-400 dark:text-indigo-300">essentials</span> like tuna, eggs,
              milk, etc.?
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <Button size="lg" variant="default" asChild>
              <Link href="/products">
                Show me essential products
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild className="bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <Link href="/products">
                Supermarket prices
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
