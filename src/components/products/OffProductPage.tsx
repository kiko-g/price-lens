import Image from "next/image"
import Link from "next/link"

import type { StoreProduct } from "@/types"
import type { OffProduct } from "@/lib/canonical/open-food-facts"

import { Badge } from "@/components/ui/badge"
import { Callout } from "@/components/ui/callout"
import { Separator } from "@/components/ui/separator"
import { Barcode } from "@/components/ui/combo/barcode"
import { NutriScoreBadge } from "@/components/ui/combo/nutri-score"
import { StoreProductCard } from "@/components/products/StoreProductCard"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"
import { OffBrandSection } from "@/components/products/OffBrandSection"
import { OffProductActions } from "@/components/products/OffProductActions"
import { OffProductDetails } from "@/components/products/OffProductDetails"

import { ChevronRightIcon, InfoIcon, StoreIcon, UtensilsIcon } from "lucide-react"

type NutriScoreGrade = "A" | "B" | "C" | "D" | "E"
const VALID_GRADES = new Set<string>(["A", "B", "C", "D", "E"])

interface OffProductPageProps {
  product: OffProduct
  barcode: string
  trackedProducts?: StoreProduct[]
}

export function OffProductPage({ product, barcode, trackedProducts }: OffProductPageProps) {
  const rawLabels = product.labels?.split(",").map((l) => l.trim()) ?? []
  const nutriGradeFromField = product.nutriscoreGrade?.toUpperCase() ?? ""
  const nutriGradeFromLabel =
    rawLabels
      .find((l) => /^en:nutri-?score-grade-[a-e]$/i.test(l))
      ?.slice(-1)
      .toUpperCase() ?? ""
  const nutriGrade = VALID_GRADES.has(nutriGradeFromField) ? nutriGradeFromField : nutriGradeFromLabel
  const hasValidNutriScore = VALID_GRADES.has(nutriGrade)
  const categories = product.categories
    ?.split(",")
    .map((c) => c.trim())
    .filter((c) => c && !/^\w{2}:/.test(c))
    .slice(0, 6)
  const labels = rawLabels.filter((l) => l && !/^\w{2}:/.test(l)).slice(0, 5)
  const primaryBrand = product.brands?.split(",")[0]?.trim() || null

  return (
    <div className="mx-auto mb-8 flex w-full max-w-[1320px] flex-col px-4 pt-4 lg:py-4">
      {/* Not tracked disclaimer */}
      <Callout variant="warning" icon={InfoIcon} className="mb-4 w-full max-w-full md:w-fit md:max-w-3xl">
        <p className="text-sm">
          This product was not found in our tracked stores, but we found it on{" "}
          <a
            href={`https://world.openfoodfacts.org/product/${barcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
          >
            Open Food Facts
            <OpenFoodFactsIcon className="h-4 w-4" />
          </a>
        </p>
      </Callout>

      {/* Breadcrumb + back button */}
      <div className="mb-2 flex items-center justify-between md:mb-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 overflow-hidden text-xs md:text-sm">
          <Link
            href="/products"
            className="text-muted-foreground hover:text-foreground truncate transition-colors hover:underline"
          >
            Products
          </Link>
          <ChevronRightIcon className="text-muted-foreground h-3 w-3 shrink-0" />
          <span className="text-muted-foreground truncate">Barcode scan</span>
          <ChevronRightIcon className="text-muted-foreground h-3 w-3 shrink-0" />
          <span className="text-foreground truncate font-semibold">{barcode}</span>
        </nav>
      </div>

      {/* Desktop hero (hidden below md) */}
      <div className="hidden w-full grid-cols-20 gap-8 md:grid">
        {/* Left column: Image + Barcode */}
        <aside className="col-span-6 flex flex-col items-center">
          <div className="relative aspect-8/7 w-full overflow-hidden rounded-lg border bg-white">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.displayName || "Product image"}
                fill
                className="max-h-full max-w-full rounded-sm object-contain object-center p-6"
                sizes="30vw"
                unoptimized
                priority
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>

          <div className="mt-4 inline-flex w-full flex-wrap items-start justify-center gap-4">
            <Barcode value={barcode} height={35} width={2} showMissingValue />
          </div>
        </aside>

        {/* Right column: Product info */}
        <section className="col-span-14 flex flex-col gap-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {primaryBrand && (
              <Link href={`/products?q=${encodeURIComponent(primaryBrand)}`} target="_blank">
                <Badge variant="blue">{primaryBrand}</Badge>
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-0">
            <h1 className="line-clamp-2 max-w-160 text-xl leading-5 font-bold xl:text-2xl xl:leading-6">
              {product.displayName}
            </h1>
            {product.servingSize && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{product.servingSize} per serving</p>
            )}
            {product.quantity && <p className="text-muted-foreground line-clamp-3 text-base">{product.quantity}</p>}
          </div>

          <div className="flex items-center gap-2">
            <OffProductActions productName={product.displayName ?? barcode} />
            <OffProductDetails
              nutriments={product.nutriments}
              servingSize={product.servingSize}
              ingredientsText={product.ingredientsText}
              allergens={product.allergens}
            />
          </div>

          {hasValidNutriScore && (
            <NutriScoreBadge
              size={0.85}
              grade={nutriGrade as NutriScoreGrade}
              showNewCalculation={false}
              compact={false}
              className="mt-2 w-fit"
            />
          )}

          {labels && labels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {labels?.map((label) => (
                <Badge key={label} variant="outline" className="text-xs font-normal">
                  {label}
                </Badge>
              ))}
            </div>
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
        </section>
      </div>

      {/* Mobile hero (hidden at md+) */}
      <article className="flex w-full flex-col gap-2.5 md:hidden">
        <div className="relative aspect-6/5 w-full max-w-lg overflow-hidden rounded-lg border bg-white">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.displayName || "Product image"}
              fill
              className="o max-h-full max-w-full object-contain object-center"
              sizes="100vw"
              unoptimized
              priority
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {primaryBrand && (
            <Link href={`/products?q=${encodeURIComponent(primaryBrand)}`}>
              <Badge variant="blue" size="sm" roundedness="sm">
                {primaryBrand}
              </Badge>
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-0">
          <h1 className="line-clamp-3 text-xl leading-6 font-bold">{product.displayName}</h1>
          {product.servingSize && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{product.servingSize} per serving</p>
          )}
          {product.quantity && <p className="text-muted-foreground line-clamp-2 text-sm">{product.quantity}</p>}
        </div>

        {labels && labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {labels?.map((label) => (
              <Badge key={label} variant="outline" className="text-xs font-normal">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {hasValidNutriScore && (
          <NutriScoreBadge
            size={0.85}
            grade={nutriGrade as NutriScoreGrade}
            showNewCalculation={false}
            compact={false}
            className="w-fit"
          />
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

        <div className="flex flex-wrap items-center gap-2">
          <OffProductActions productName={product.displayName ?? barcode} />
          <OffProductDetails
            nutriments={product.nutriments}
            servingSize={product.servingSize}
            ingredientsText={product.ingredientsText}
            allergens={product.allergens}
          />
        </div>
      </article>

      {/* Tracked products from our stores */}
      {trackedProducts && trackedProducts.length > 0 && (
        <>
          <Separator className="mt-8 mb-4" />
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
          <Separator className="mt-8 mb-4" />
          <OffBrandSection brand={primaryBrand} excludeBarcode={barcode} />
        </>
      )}
    </div>
  )
}
