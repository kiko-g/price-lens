"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { basketProducts } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { TrendingUpIcon, ArrowRightIcon } from "lucide-react"

export function InflationBasket() {
  const [selectedCategory, setSelectedCategory] = useState("meat")
  const categories = [...new Set(basketProducts.map((p) => p.category))]
  const filteredProducts = basketProducts.filter((p) => p.category === selectedCategory)

  if (process.env.NODE_ENV === "production") return null

  return (
    <section className="w-full border-t border-indigo-50/80 bg-white bg-gradient-to-br from-indigo-50/20 to-indigo-50/20 py-12 dark:border-indigo-500/10 dark:bg-zinc-950 dark:from-indigo-500/5 dark:to-indigo-500/10 md:py-16 lg:py-24">
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

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
            <Tabs defaultValue="meat" value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="mb-8 flex flex-wrap justify-center gap-0 bg-transparent md:gap-2">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-none border-b-2 border-transparent bg-transparent text-sm capitalize text-muted-foreground transition data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-transparent data-[state=active]:hover:bg-primary/10"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {basketProducts
                      .filter((p) => p.category === cat)
                      .map((product, index) => (
                        <Card
                          key={index}
                          className="max-w-60 rounded-xl border-transparent shadow-md transition-shadow hover:shadow-lg"
                        >
                          <Image
                            src={product.image || "/next.svg"}
                            alt={product.name_en}
                            width={100}
                            height={100}
                            className="aspect-square w-full rounded-t-2xl object-cover"
                          />
                          <CardContent className="flex flex-col items-start px-3.5 py-3 [&>*]:leading-tight [&>*]:tracking-tight">
                            <h2 className="text-left text-base font-semibold">{product.name_pt}</h2>
                            <p className="text-left text-sm font-medium text-muted-foreground">{product.name_en}</p>
                            <p className="text-left text-sm font-normal text-muted-foreground opacity-80">
                              {product.quantity}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  )
}
