"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { SupermarketChain, STORE_NAMES, STORE_LOGO_PATHS } from "@/types/business"
import { markOnboardingComplete } from "@/components/layout/WelcomeToast"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { CheckIcon, HeartIcon, BellIcon, ArrowRightIcon, SparklesIcon, TagIcon } from "lucide-react"

const stores = [
  {
    id: SupermarketChain.Continente,
    name: STORE_NAMES[SupermarketChain.Continente],
    logo: STORE_LOGO_PATHS[SupermarketChain.Continente],
  },
  {
    id: SupermarketChain.Auchan,
    name: STORE_NAMES[SupermarketChain.Auchan],
    logo: STORE_LOGO_PATHS[SupermarketChain.Auchan],
  },
  {
    id: SupermarketChain.PingoDoce,
    name: STORE_NAMES[SupermarketChain.PingoDoce],
    logo: STORE_LOGO_PATHS[SupermarketChain.PingoDoce],
  },
]

const features = [
  {
    icon: HeartIcon,
    title: "Favorite products",
    description: "Track the products you buy regularly and see their price trends over time.",
  },
  {
    icon: BellIcon,
    title: "Price alerts",
    description: "Get notified by email when your tracked products drop in price.",
  },
  {
    icon: TagIcon,
    title: "Browse deals",
    description: "See the biggest price drops and discounts across all stores in one place.",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedStores, setSelectedStores] = useState<Set<number>>(new Set())

  const toggleStore = (id: number) => {
    setSelectedStores((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleComplete = () => {
    markOnboardingComplete()
    router.push("/")
  }

  const handleSkip = () => {
    markOnboardingComplete()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === step ? "bg-primary w-8" : i < step ? "bg-primary/50 w-2" : "bg-muted w-2",
              )}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="animate-fade-in space-y-6 text-center">
            <SparklesIcon className="text-primary mx-auto size-12" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome to Price Lens</h1>
              <p className="text-muted-foreground mt-2 text-sm text-balance">
                Track prices across Portuguese supermarkets and never overpay for groceries again. Let&apos;s get you
                set up in 30 seconds.
              </p>
            </div>

            <div className="space-y-3 text-left">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <feature.icon className="text-primary size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-muted-foreground text-xs">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => setStep(1)} className="w-full">
                Get started
                <ArrowRightIcon className="ml-1.5 size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Pick stores */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6 text-center">
            <div>
              <h2 className="text-xl font-bold">Where do you shop?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Select the stores you visit so we can personalize your experience.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {stores.map((store) => {
                const selected = selectedStores.has(store.id)
                return (
                  <Card
                    key={store.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selected ? "border-primary ring-primary/20 ring-2" : "hover:border-primary/50",
                    )}
                    onClick={() => toggleStore(store.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="relative h-8 w-20">
                        <Image src={store.logo.src} alt={store.name} fill className="object-contain" sizes="80px" />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium">{store.name}</span>
                      <div
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                          selected ? "bg-primary border-primary" : "border-muted-foreground/30",
                        )}
                      >
                        {selected && <CheckIcon className="size-3.5 text-white" />}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => setStep(2)} className="w-full">
                Continue
                <ArrowRightIcon className="ml-1.5 size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Ready to go */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6 text-center">
            <div className="bg-primary/10 mx-auto flex size-16 items-center justify-center rounded-full">
              <CheckIcon className="text-primary size-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">You&apos;re all set!</h2>
              <p className="text-muted-foreground mt-1 text-sm text-balance">
                Start browsing products, favorite the ones you care about, and set price alerts to get notified when
                they drop.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleComplete} className="w-full">
                Start exploring
                <ArrowRightIcon className="ml-1.5 size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  markOnboardingComplete()
                  router.push("/deals")
                }}
                className="w-full"
              >
                <TagIcon className="mr-1.5 size-4" />
                Browse deals first
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
