"use client"

import { useState } from "react"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { CalculatorIcon, ShoppingBasketIcon } from "lucide-react"

const AVG_PRICE = 4
const DISCOUNT_RATE = 0.2
const DISCOUNT_CHANCE = 0.6

function calculateSavings(products: number) {
  const monthly = products * DISCOUNT_CHANCE * AVG_PRICE * DISCOUNT_RATE
  return { monthly: Math.round(monthly), yearly: Math.round(monthly * 12) }
}

export function SavePotential() {
  const [products, setProducts] = useState(200)
  const { monthly, yearly } = calculateSavings(products)

  return (
    <section className="w-full px-4 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-5 md:px-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="max-w-4xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            How much could you save?
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm md:text-lg/relaxed">
            Most products go on discount at some point. If you buy at the right time, the savings add up fast. Drag the
            slider to see for yourself.
          </p>
        </div>

        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label htmlFor="products-slider" className="text-sm font-medium">
                  Products you buy per month
                </label>
                <span className="bg-muted rounded-md px-2.5 py-0.5 text-sm font-semibold tabular-nums">{products}</span>
              </div>

              <input
                id="products-slider"
                type="range"
                min={50}
                max={500}
                step={10}
                value={products}
                onChange={(e) => setProducts(Number(e.target.value))}
                className="accent-primary [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-primary [&::-moz-range-track]:bg-secondary [&::-webkit-slider-runnable-track]:bg-secondary [&::-webkit-slider-thumb]:bg-primary h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
              />

              <div className="text-muted-foreground flex justify-between text-xs">
                <span>50</span>
                <span>500</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 flex flex-col items-center gap-1 rounded-lg p-4 md:p-6">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Per month</span>
                <span className="text-primary text-3xl font-bold tabular-nums md:text-4xl">€{monthly}</span>
              </div>
              <div className="bg-primary/10 flex flex-col items-center gap-1 rounded-lg p-4 md:p-6">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Per year</span>
                <span className="text-primary text-3xl font-bold tabular-nums md:text-4xl">€{yearly}</span>
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full" asChild>
              <Link href="/products">
                Start saving with Price Lens
                <ShoppingBasketIcon className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="text-muted-foreground flex items-start gap-2 text-xs md:items-center">
          <CalculatorIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 md:mt-0" />
          <p>
            Assumes avg. product price of €{AVG_PRICE}, ~{DISCOUNT_CHANCE * 100}% of products go on sale each month, and
            an avg. discount of {DISCOUNT_RATE * 100}%. Actual savings depend on your shopping habits.
          </p>
        </div>
      </div>
    </section>
  )
}
