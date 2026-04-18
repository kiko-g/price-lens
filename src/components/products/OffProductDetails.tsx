"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

import type { OffNutriments } from "@/lib/canonical/open-food-facts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { Separator } from "@/components/ui/separator"
import { DrawerSheet } from "@/components/ui/combo/drawer-sheet"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

const VALID_ECO_GRADES = new Set(["A", "B", "C", "D", "E"])

interface OffProductDetailsProps {
  nutriments: OffNutriments | null
  servingSize: string | null
  ingredientsText: string | null
  allergens: string | null
  imageNutritionUrl?: string | null
  imageIngredientsUrl?: string | null
  packagingText?: string | null
  completeness?: number | null
  ecoscoreGrade?: string | null
  nutrientLevels?: Record<string, string> | null
  labels?: string[]
}

export function OffProductDetails({
  nutriments,
  servingSize,
  ingredientsText,
  allergens,
  imageNutritionUrl,
  imageIngredientsUrl,
  packagingText,
  completeness,
  ecoscoreGrade,
  nutrientLevels,
  labels,
}: OffProductDetailsProps) {
  const hasNutrition = nutriments !== null
  const hasIngredients = !!ingredientsText
  const hasAllergens = !!allergens
  const hasNutritionImage = !!imageNutritionUrl
  const hasIngredientsImage = !!imageIngredientsUrl
  const hasPackaging = !!packagingText
  const hasEcoScore = VALID_ECO_GRADES.has(ecoscoreGrade?.toUpperCase() ?? "")
  const hasNutrientLevels = nutrientLevels && Object.keys(nutrientLevels).length > 0
  const hasLabels = labels && labels.length > 0
  const hasAny =
    hasNutrition ||
    hasIngredients ||
    hasAllergens ||
    hasNutritionImage ||
    hasIngredientsImage ||
    hasPackaging ||
    hasEcoScore ||
    hasNutrientLevels ||
    hasLabels

  const t = useTranslations("products.offDetails")

  if (!hasAny) return null

  return (
    <DrawerSheet
      title={t("title")}
      description={t("subtitle")}
      trigger={
        <Button variant="outline" size="sm">
          <OpenFoodFactsIcon className="size-4 shrink-0" />
          {t("title")}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {hasNutrition && (
          <section>
            <NutritionTable nutriments={nutriments} servingSize={servingSize} />
          </section>
        )}

        {hasNutrientLevels && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("nutrientLevels")}</h3>
            <NutrientLevelIndicators levels={nutrientLevels!} />
          </section>
        )}

        {hasNutritionImage && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("nutritionLabel")}</h3>
            <div className="relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-lg border bg-white">
              <Image
                src={imageNutritionUrl!}
                alt={t("nutritionLabel")}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 100vw, 400px"
                unoptimized
              />
            </div>
          </section>
        )}

        {(hasEcoScore || hasLabels) && (
          <>
            <Separator />
            <section className="flex flex-col gap-3">
              {hasEcoScore && (
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold">{t("environmentalImpact")}</h3>
                  <Badge variant="secondary" className="gap-1 text-xs font-medium">
                    Eco-Score {ecoscoreGrade!.toUpperCase()}
                  </Badge>
                </div>
              )}
              {hasLabels && (
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold">{t("labels")}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {labels!.map((label) => (
                      <Badge key={label} variant="outline" className="text-xs font-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {(hasIngredients || hasAllergens) && (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("ingredients")}</h3>
              {hasIngredients && <p className="text-muted-foreground text-sm leading-relaxed">{ingredientsText}</p>}
              {hasAllergens && (
                <Callout variant="warning" className="mt-2">
                  <p className="text-sm">
                    <span className="font-semibold">{t("allergens")}: </span>
                    {allergens}
                  </p>
                </Callout>
              )}
            </section>
          </>
        )}

        {hasIngredientsImage && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("ingredientsLabel")}</h3>
            <div className="relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-lg border bg-white">
              <Image
                src={imageIngredientsUrl!}
                alt={t("ingredientsLabel")}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 100vw, 400px"
                unoptimized
              />
            </div>
          </section>
        )}

        {hasPackaging && (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("packaging")}</h3>
              <p className="text-muted-foreground text-sm">{packagingText}</p>
            </section>
          </>
        )}

        {completeness != null && (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("dataQuality")}</h3>
              <div className="flex items-center gap-2">
                <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.round(completeness * 100)}%` }}
                  />
                </div>
                <Badge variant="secondary" size="xs">
                  {t("percentComplete", { percent: Math.round(completeness * 100) })}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{t("dataQualityNote")}</p>
            </section>
          </>
        )}
      </div>
    </DrawerSheet>
  )
}

// ─── Nutrition table ──────────────────────────────────────────────────

type NutritionRow = {
  labelKey: "energy" | "fat" | "saturatedFat" | "carbohydrates" | "sugars" | "fiber" | "proteins" | "salt"
  key: keyof OffNutriments
  unit: string
  indent?: boolean
}

const NUTRITION_ROWS: NutritionRow[] = [
  { labelKey: "energy", key: "energyKcal100g", unit: "kcal" },
  { labelKey: "fat", key: "fat100g", unit: "g" },
  { labelKey: "saturatedFat", key: "saturatedFat100g", unit: "g", indent: true },
  { labelKey: "carbohydrates", key: "carbohydrates100g", unit: "g" },
  { labelKey: "sugars", key: "sugars100g", unit: "g", indent: true },
  { labelKey: "fiber", key: "fiber100g", unit: "g" },
  { labelKey: "proteins", key: "proteins100g", unit: "g" },
  { labelKey: "salt", key: "salt100g", unit: "g" },
]

function formatNutrientValue(value: number | null, unit: string): string {
  if (value === null) return "—"
  if (unit === "kcal") return `${Math.round(value)} ${unit}`
  return `${value.toFixed(1)} ${unit}`
}

function NutritionTable({ nutriments, servingSize }: { nutriments: OffNutriments; servingSize: string | null }) {
  const hasEnergyKj = nutriments.energyKj100g !== null
  const t = useTranslations("products.offDetails.nutrition")

  return (
    <div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2.5 text-left font-medium">{t("per100g")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {NUTRITION_ROWS.map(({ labelKey, key, unit, indent }) => {
              const value = nutriments[key]
              if (value === null) return null

              return (
                <tr key={key} className="hover:bg-muted/30 transition-colors">
                  <td className={`px-4 py-2 ${indent ? "text-muted-foreground pl-8" : "font-medium"}`}>
                    {t(labelKey)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatNutrientValue(value, unit)}</td>
                </tr>
              )
            })}
            {hasEnergyKj && (
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="text-muted-foreground px-4 py-2 pl-8">{t("energyKj")}</td>
                <td className="px-4 py-2 text-right tabular-nums">{Math.round(nutriments.energyKj100g!)} kJ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {servingSize && (
        <p className="text-muted-foreground mt-2 text-xs">{t("servingSize", { size: servingSize })}</p>
      )}
    </div>
  )
}

// ─── Nutrient level traffic lights ──────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  low: "bg-green-500",
  moderate: "bg-amber-500",
  high: "bg-red-500",
}

const LEVEL_LABEL_KEYS: Record<string, "fat" | "saturatedFat" | "sugars" | "salt"> = {
  fat: "fat",
  "saturated-fat": "saturatedFat",
  sugars: "sugars",
  salt: "salt",
}

function NutrientLevelIndicators({ levels }: { levels: Record<string, string> }) {
  const t = useTranslations("products.offDetails.nutrition")
  const tLevel = useTranslations("products.offDetails.levels")
  const entries = Object.entries(levels).filter(([key]) => key in LEVEL_LABEL_KEYS)
  if (entries.length === 0) return null

  const localizeLevel = (level: string): string => {
    if (level === "low" || level === "moderate" || level === "high") return tLevel(level)
    return level
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {entries.map(([key, level]) => (
        <span key={key} className="flex items-center gap-1.5 text-xs">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${LEVEL_COLORS[level] ?? "bg-gray-400"}`} />
          <span className="text-muted-foreground">
            {t(LEVEL_LABEL_KEYS[key])}: <span className="font-medium">{localizeLevel(level)}</span>
          </span>
        </span>
      ))}
    </div>
  )
}
