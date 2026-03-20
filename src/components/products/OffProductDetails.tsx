"use client"

import type { OffNutriments } from "@/lib/canonical/open-food-facts"

import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { DrawerSheet } from "@/components/ui/combo/drawer-sheet"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

import { WheatIcon, TriangleAlertIcon } from "lucide-react"

interface OffProductDetailsProps {
  nutriments: OffNutriments | null
  servingSize: string | null
  ingredientsText: string | null
  allergens: string | null
}

export function OffProductDetails({ nutriments, servingSize, ingredientsText, allergens }: OffProductDetailsProps) {
  const hasNutrition = nutriments !== null
  const hasIngredients = !!ingredientsText
  const hasAllergens = !!allergens

  if (!hasNutrition && !hasIngredients && !hasAllergens) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasNutrition && (
        <DrawerSheet
          title="Nutrition"
          description="Per 100g nutritional values"
          trigger={
            <Button variant="outline" size="sm">
              <OpenFoodFactsIcon className="size-4 shrink-0" />
              Product Details
            </Button>
          }
        >
          <NutritionTable nutriments={nutriments} servingSize={servingSize} />
        </DrawerSheet>
      )}

      {hasIngredients && (
        <DrawerSheet
          title="Ingredients"
          trigger={
            <Button variant="outline" size="sm">
              <WheatIcon className="size-4 shrink-0" />
              Ingredients
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm leading-relaxed">{ingredientsText}</p>
            {hasAllergens && (
              <Callout variant="warning">
                <p className="text-sm">
                  <span className="font-semibold">Allergens: </span>
                  {allergens}
                </p>
              </Callout>
            )}
          </div>
        </DrawerSheet>
      )}

      {!hasIngredients && hasAllergens && (
        <DrawerSheet
          title="Allergens"
          trigger={
            <Button variant="outline" size="sm">
              <TriangleAlertIcon className="size-4 shrink-0" />
              Allergens
            </Button>
          }
        >
          <Callout variant="warning">
            <p className="text-sm">
              <span className="font-semibold">Allergens: </span>
              {allergens}
            </p>
          </Callout>
        </DrawerSheet>
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
