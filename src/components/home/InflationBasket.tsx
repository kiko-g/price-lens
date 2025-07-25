"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { TrendingUpIcon, MicroscopeIcon, ShoppingBasketIcon } from "lucide-react"

export function InflationBasket() {
  return (
    <section className="border-border dark:bg-muted w-full border-t bg-white py-12 md:py-16 lg:py-24 dark:border-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Badge variant="secondary">
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
