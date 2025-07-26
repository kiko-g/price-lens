"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { TrendingUpIcon, MicroscopeIcon, ShoppingBasketIcon } from "lucide-react"

export function InflationBasketConcept() {
  return (
    <section className="border-border dark:bg-primary/10 bg-primary/5 w-full border-t py-12 md:py-16 lg:py-24">
      <div className="mx-auto w-full px-5 md:px-16">
        <div className="flex flex-col items-center justify-center space-y-4 text-center md:items-center">
          <Badge variant="secondary">
            <TrendingUpIcon className="h-4 w-4" />
            <span className="font-medium tracking-tighter md:tracking-normal">
              Inflation depends on a selected basket of products
            </span>
          </Badge>
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Beware of price trends within key products
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
              The inflation basket represents essential products selected by economic authorities to track consumer
              prices. The selection can change over time, but Price Lens keeps an eye on price trends on products that
              matter forever. Who doesn&apos;t care about the price of{" "}
              <span className="text-primary font-medium">essentials</span> like tuna, eggs, milk, etc.?
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <Button size="lg" variant="marketing" asChild className="w-full md:w-auto">
              <Link href="/products">
                Relevant products
                <MicroscopeIcon className="h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="marketing-white" asChild className="w-full md:w-auto">
              <Link href="/supermarket">
                Supermarket listings
                <ShoppingBasketIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
