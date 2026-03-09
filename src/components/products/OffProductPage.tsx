import Image from "next/image"
import Link from "next/link"

import type { StoreProduct } from "@/types"
import type { OffProduct, OffNutriments } from "@/lib/canonical/open-food-facts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Barcode } from "@/components/ui/combo/barcode"
import { NutriScore } from "@/components/ui/combo/nutri-score"
import { BackButton } from "@/components/ui/combo/back-button"
import { StoreProductCard } from "@/components/products/StoreProductCard"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"
import { OffBrandSection } from "@/components/products/OffBrandSection"

import {
  ChevronRightIcon,
  ExternalLinkIcon,
  InfoIcon,
  PackageIcon,
  StoreIcon,
  TagIcon,
  UtensilsIcon,
  WheatIcon,
} from "lucide-react"

type NutriScoreGrade = "A" | "B" | "C" | "D" | "E"
const VALID_GRADES = new Set<string>(["A", "B", "C", "D", "E"])

interface OffProductPageProps {
  product: OffProduct
  barcode: string
  trackedProducts?: StoreProduct[]
}

export function OffProductPage({ product, barcode, trackedProducts }: OffProductPageProps) {
  const nutriGrade = product.nutriscoreGrade?.toUpperCase() ?? ""
  const hasValidNutriScore = VALID_GRADES.has(nutriGrade)
  const categories = product.categories
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 6)
  const labels = product.labels
    ?.split(",")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
  const hasNutrition = product.nutriments !== null
  const primaryBrand = product.brands?.split(",")[0]?.trim() || null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 md:py-6">
      {/* Breadcrumb + back button */}
      <div className="mb-3 flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs md:text-sm">
          <Link
            href="/products"
            className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
          >
            Products
          </Link>
          <ChevronRightIcon className="text-muted-foreground h-3 w-3" />
          <span className="text-foreground font-semibold">Product details</span>
        </nav>
        <div className="hidden md:block">
          <BackButton />
        </div>
      </div>

      {/* Hero section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] md:gap-8">
        {/* Image */}
        <div className="flex flex-col items-start gap-4 md:items-center">
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border bg-white">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.displayName || "Product image"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 280px"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PackageIcon className="text-muted-foreground h-16 w-16" />
              </div>
            )}
          </div>

          <Barcode value={barcode} height={35} width={1.8} className="hidden md:flex" />
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            {primaryBrand && (
              <Badge variant="blue" className="w-fit" size="md">
                {primaryBrand}
              </Badge>
            )}

            <Button asChild variant="outline" size="sm" roundedness="lg">
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noopener noreferrer">
                <OpenFoodFactsIcon className="h-4 w-4" />
                View on Open Food Facts
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </Button>
          </div>

          <h1 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">{product.displayName}</h1>

          <div className="flex flex-wrap items-center gap-2">
            {product.quantity && (
              <Badge variant="secondary" className="gap-1">
                <TagIcon className="h-3 w-3" />
                {product.quantity}
              </Badge>
            )}
            {product.servingSize && (
              <Badge variant="secondary" className="gap-1">
                <UtensilsIcon className="h-3 w-3" />
                {product.servingSize} per serving
              </Badge>
            )}
            {labels?.map((label) => (
              <Badge key={label} variant="outline" className="text-xs font-normal">
                {label}
              </Badge>
            ))}
          </div>

          {hasValidNutriScore && (
            <NutriScore grade={nutriGrade as NutriScoreGrade} showNewCalculation={false} className="w-fit" />
          )}

          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <Badge key={cat} variant="boring" className="text-xs font-normal">
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Not tracked disclaimer */}
          <Callout variant="warning" icon={InfoIcon} className="max-w-md">
            <p className="text-sm">
              We found this product externally but it does not exist in our tracked stores. The information in this page
              is sourced from{" "}
              <a
                href={`https://world.openfoodfacts.org/product/${barcode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
              >
                Open Food Facts
              </a>
              .
            </p>
          </Callout>

          {/* Product details accordion (nutrition, ingredients, allergens) */}
          {(hasNutrition || product.ingredientsText || product.allergens) && (
            <Accordion type="multiple" className="w-full max-w-md">
              {hasNutrition && (
                <AccordionItem value="nutrition">
                  <AccordionTrigger className="mb-3 rounded-lg border px-2 py-1.5 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-1.5">
                      <OpenFoodFactsIcon className="size-4 shrink-0" />
                      Nutrition
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <NutritionTable nutriments={product.nutriments!} servingSize={product.servingSize} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.ingredientsText && (
                <AccordionItem value="ingredients">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <WheatIcon className="h-5 w-5" />
                      Ingredients
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{product.ingredientsText}</p>
                    {product.allergens && (
                      <Callout variant="warning" className="mt-3">
                        <p className="text-sm">
                          <span className="font-semibold">Allergens: </span>
                          {product.allergens}
                        </p>
                      </Callout>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {!product.ingredientsText && product.allergens && (
                <AccordionItem value="allergens">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">Allergens</AccordionTrigger>
                  <AccordionContent>
                    <Callout variant="warning">
                      <p className="text-sm">
                        <span className="font-semibold">Allergens: </span>
                        {product.allergens}
                      </p>
                    </Callout>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>
      </div>

      {/* Tracked products from our stores */}
      {trackedProducts && trackedProducts.length > 0 && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <StoreIcon className="h-5 w-5" />
              Similar products in our stores
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {trackedProducts.map((sp) => (
                <StoreProductCard key={sp.id} sp={sp} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* On-demand OFF brand products */}
      {primaryBrand && (
        <>
          <Separator className="my-6" />
          <OffBrandSection brand={primaryBrand} excludeBarcode={barcode} />
        </>
      )}
    </div>
  )
}

// ─── Nutrition table ──────────────────────────────────────────────────

const NUTRITION_ROWS: { label: string; key: keyof OffNutriments; unit: string; indent?: boolean }[] = [
  { label: "Energy", key: "energyKcal100g", unit: "kcal" },
  { label: "Fat", key: "fat100g", unit: "g" },
  { label: "Saturated fat", key: "saturatedFat100g", unit: "g", indent: true },
  { label: "Carbohydrates", key: "carbohydrates100g", unit: "g" },
  { label: "Sugars", key: "sugars100g", unit: "g", indent: true },
  { label: "Fiber", key: "fiber100g", unit: "g" },
  { label: "Proteins", key: "proteins100g", unit: "g" },
  { label: "Salt", key: "salt100g", unit: "g" },
]

function formatNutrientValue(value: number | null, unit: string): string {
  if (value === null) return "—"
  if (unit === "kcal") return `${Math.round(value)} ${unit}`
  return `${value.toFixed(1)} ${unit}`
}

function NutritionTable({ nutriments, servingSize }: { nutriments: OffNutriments; servingSize: string | null }) {
  const hasEnergyKj = nutriments.energyKj100g !== null

  return (
    <div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2.5 text-left font-medium">Per 100g</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {NUTRITION_ROWS.map(({ label, key, unit, indent }) => {
              const value = nutriments[key]
              if (value === null) return null

              return (
                <tr key={key} className="hover:bg-muted/30 transition-colors">
                  <td className={`px-4 py-2 ${indent ? "text-muted-foreground pl-8" : "font-medium"}`}>{label}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatNutrientValue(value, unit)}</td>
                </tr>
              )
            })}
            {hasEnergyKj && (
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="text-muted-foreground px-4 py-2 pl-8">Energy (kJ)</td>
                <td className="px-4 py-2 text-right tabular-nums">{Math.round(nutriments.energyKj100g!)} kJ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {servingSize && <p className="text-muted-foreground mt-2 text-xs">Serving size: {servingSize}</p>}
    </div>
  )
}
