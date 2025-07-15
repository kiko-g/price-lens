import Link from "next/link"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/magicui/border-beam"

export function PricingSection() {
  const isComingSoon = true

  return (
    <section className="w-full bg-gradient-to-b py-12 md:py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="animate-fade-in text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] animate-fade-in text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Track supermarket prices and stay aware of inflation with Price Lens. Choose the plan that works for you.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 grid max-w-5xl animate-fade-in grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:mt-12 lg:gap-10">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-col space-y-1.5 p-6">
              <CardTitle className="text-2xl font-bold">Free</CardTitle>
              <CardDescription>Essential price tracking for everyone</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="ml-1 text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>14-day price history</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Track handpicked inflation basket products</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Access and compare multiple supermarkets origins</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Basic weekly price alerts</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button asChild className="w-full" variant="outline">
                <Link href="/signup">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Plus Plan */}
          <Card className="relative flex flex-col overflow-hidden">
            <BorderBeam duration={5} size={200} colorFrom="#837ded" colorTo="#6791f1" />

            {!isComingSoon && (
              <span className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-indigo-600/70 to-blue-600/70 px-3 py-1 text-xs font-medium text-white">
                Popular
              </span>
            )}
            <CardHeader className="flex flex-col space-y-1.5 p-6">
              <CardTitle className="text-2xl font-bold">Plus</CardTitle>
              <CardDescription>Advanced tracking for savvy shoppers and inflation doomers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="ml-1 text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Full price history (not just 14 days)</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Unlimited custom product tracking</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Daily price reports (vs. weekly in Free)</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Inflation insights dashboard with trends</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Shopping list optimizer across stores</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Purchasing power impact calculator</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span>Export CSV data and API access</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button disabled={isComingSoon} className="w-full" variant="gradient-primary">
                {isComingSoon ? "Coming soon" : "Get Plus"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            All plans include the core functionality for price transparency and inflation awareness. Any questions?{" "}
            <Link
              href="mailto:kikojpgoncalves@gmail.com"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
