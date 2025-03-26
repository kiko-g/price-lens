"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { BasketProduct } from "@/types"
import { basketProducts } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { SearchIcon, ShoppingBasketIcon, TrendingUpIcon, InfoIcon, ArrowRightIcon } from "lucide-react"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"

export function InflationBasket() {
  const [searchTerm, setSearchTerm] = useState("")

  // Get unique categories
  const categories = Array.from(new Set(basketProducts.map((bp) => bp.category)))

  // Filter products based on search term
  const filteredProducts = basketProducts.filter(
    (product) =>
      product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name_pt.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Function to get image path based on product category and name
  const getProductImagePath = (bp: BasketProduct) => {
    return `/next.svg?height=80&width=80`
  }

  return (
    <section className="w-full bg-white bg-gradient-to-br from-indigo-50 to-indigo-50/50 py-12 dark:bg-zinc-950 dark:from-indigo-500/5 dark:to-indigo-500/10 md:py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Badge className="bg-transparent bg-gradient-to-br from-indigo-600/70 to-blue-600/70 text-white dark:text-white">
            <TrendingUpIcon className="mr-2 h-4 w-4" />
            Inflation depends on basket of selected products
          </Badge>
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Beware of price trends within key products
            </h2>
            <p className="mx-auto max-w-3xl text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              The inflation basket represents essential products selected by economic authorities to track consumer
              prices. The selection can change over time, but Price Lens keeps an eye on price trends on products that
              matter forever.{" "}
              <span className="font-semibold text-zinc-900 dark:text-white">
                Everyone should beware and care about the price of eggs or milk
              </span>
              .
            </p>
          </div>

          <div className="flex flex-row gap-4">
            <Button size="lg" variant="default" asChild>
              <Link href="/products">
                Start Saving
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
