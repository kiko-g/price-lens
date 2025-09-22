"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { StoreProduct } from "@/types"
import { discountValueToPercentage } from "@/lib/utils"
import { toast } from "sonner"
import {
  Undo2Icon,
  HeartIcon,
  InfoIcon,
  NavigationIcon,
  NavigationOffIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  RadarIcon,
  MicroscopeIcon,
  CircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShareButton } from "@/components/ui/combo/ShareButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Code } from "@/components/Code"
import { ProductChart } from "@/components/model/ProductChart"
import { resolveSupermarketChain } from "@/components/model/Supermarket"
import { RelatedStoreProducts } from "@/components/model/RelatedStoreProducts"
import { useUpdateStoreProduct, useUpdateStoreProductPriority } from "@/hooks/useProducts"
import { LoadingIcon } from "@/components/icons/LoadingIcon"
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle"
import { useUser } from "@/hooks/useUser"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { IdenticalStoreProducts } from "./IdenticalStoreProducts"
import { Separator } from "../ui/separator"

function resolveImageUrlForPage(image: string, size = 800) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  p.set("fit", "crop")
  return url.toString()
}

function FavoriteButton({ storeProduct }: { storeProduct: StoreProduct }) {
  const { user } = useUser()
  const { toggleFavorite, isLoading } = useFavoriteToggle()
  const [isFavorited, setIsFavorited] = useState(storeProduct.is_favorited ?? false)

  const favoriteLoading = isLoading(storeProduct.id ?? 0)

  const handleToggleFavorite = async () => {
    if (!storeProduct.id) return

    const result = await toggleFavorite(storeProduct.id, isFavorited)
    if (result.success) {
      setIsFavorited(result.newState)
    }
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" disabled title="Log in to add favorites">
        <HeartIcon className="h-4 w-4" />
        Add to favorites
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleFavorite}
      disabled={favoriteLoading}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <HeartIcon
        className={cn(
          "h-4 w-4",
          isFavorited ? "fill-destructive stroke-destructive" : "stroke-foreground fill-none",
          favoriteLoading && "animate-pulse",
        )}
      />
      {isFavorited ? "Remove from favorites" : "Add to favorites"}
    </Button>
  )
}

export function StoreProductPage({ sp }: { sp: StoreProduct }) {
  const router = useRouter()
  const { user, profile } = useUser()
  const updateStoreProduct = useUpdateStoreProduct()
  const updatePriority = useUpdateStoreProductPriority()
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)

  const supermarketChain = resolveSupermarketChain(sp?.origin_id)
  const storeProductId = sp.id?.toString() || ""
  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isPriceRecommendedNotSet = !sp.price_recommended && sp.price
  const isPriceEqualToRecommended = sp.price_recommended && sp.price && sp.price_recommended === sp.price
  const isNormalPrice = isPriceRecommendedNotSet || isPriceEqualToRecommended

  return (
    <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col py-0 lg:py-4">
      <div className="flex w-min">
        <Button variant="outline" className="mb-2" size="sm" onClick={() => router.back()}>
          <Undo2Icon className="h-4 w-4" />
          Back to supermarket products
        </Button>
      </div>

      <div className="grid w-full gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-lg border bg-white">
          {sp.image ? (
            <Image
              fill
              src={resolveImageUrlForPage(sp.image, 800)}
              alt={sp.name}
              className="max-h-full max-w-full object-contain object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {sp.category || sp.category_2 || sp.category_3 ? (
                <Badge variant="boring" size="2xs" roundedness="sm" className="w-fit max-w-80">
                  {sp.category} {sp.category_2 && ` > ${sp.category_2}`} {sp.category_3 && ` > ${sp.category_3}`}
                </Badge>
              ) : null}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              {sp.brand && (
                <Link href={`/supermarket?q=${encodeURIComponent(sp.brand)}`} target="_blank">
                  <Badge variant="blue">
                    <RadarIcon />
                    {sp.brand}
                  </Badge>
                </Link>
              )}

              {sp.priority && sp.priority >= 3 ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="success">
                        <NavigationIcon className="h-4 w-4" />
                        Priority {sp.priority}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      variant="glass"
                      className="max-w-60"
                    >
                      This product has high tracking priority ({sp.priority}/5) and is being actively tracked.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline-destructive">
                        <NavigationOffIcon className="h-4 w-4" />
                        {sp.priority === null ? "Not tracked" : `Priority ${sp.priority}`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      variant="destructive"
                      className="max-w-60"
                    >
                      <p>
                        This product has{" "}
                        {sp.priority === null ? "no tracking priority" : `low tracking priority (${sp.priority}/5)`}.
                      </p>
                      <p className="mt-2 font-bold">Add to your favorites to increase tracking priority.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Button
                variant="outline"
                size="sm"
                roundedness="2xl"
                asChild
                className="dark:bg-white dark:hover:bg-white/90"
              >
                <Link href={sp.url} target="_blank" rel="noreferrer noopener">
                  {supermarketChain?.logo}
                </Link>
              </Button>
            </div>

            <h1 className="line-clamp-3 text-2xl font-bold md:line-clamp-2">{sp.name}</h1>
            {sp.pack && <p className="text-muted-foreground line-clamp-3 text-sm md:text-base">{sp.pack}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-green-800 dark:text-green-600">{sp.price}€</span>
                <span className="text-muted-foreground text-base line-through">{sp.price_recommended}€</span>
              </>
            ) : null}

            {isNormalPrice ? (
              <span className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span>
            ) : null}

            {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">€€€€</span> : null}
          </div>

          <div className="flex items-center gap-2">
            {sp.price_per_major_unit && sp.major_unit ? (
              <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
                {sp.price_per_major_unit}€/{sp.major_unit.startsWith("/") ? sp.major_unit.slice(1) : sp.major_unit}
              </Badge>
            ) : null}

            {sp.discount ? (
              <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
                -{discountValueToPercentage(sp.discount)}
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <FavoriteButton storeProduct={sp} />
            <ShareButton url={sp.url} title={sp.name} description={sp.name} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Drawer open={isDetailsDrawerOpen} onOpenChange={setIsDetailsDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="dropdown-item" className="hover:bg-accent flex items-center justify-start gap-2">
                        <InfoIcon className="-ml-1 h-4 w-4" />
                        Store product details
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="overflow-y-auto">
                      <DrawerHeader className="text-left">
                        <DrawerTitle>Details</DrawerTitle>
                        <DrawerDescription>Inspect store product data</DrawerDescription>
                      </DrawerHeader>

                      <div className="max-w-md px-4">
                        <Code code={JSON.stringify(sp, null, 2)} language="json" />
                      </div>
                    </DrawerContent>
                  </Drawer>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Button
                    variant="dropdown-item"
                    className="hover:bg-accent flex items-center justify-start gap-2"
                    onClick={() => updateStoreProduct.mutate(sp)}
                    disabled={updateStoreProduct.isPending}
                  >
                    {updateStoreProduct.isPending ? <LoadingIcon /> : <RefreshCcwIcon className="h-4 w-4" />}
                    Update from source store
                  </Button>
                </DropdownMenuItem>

                {(process.env.NODE_ENV === "development" || profile?.role === "admin") && (
                  <>
                    <DropdownMenuSeparator className="[&:not(:has(+*))]:hidden" />
                    <DropdownMenuLabel>Admin tools</DropdownMenuLabel>

                    <DropdownMenuItem asChild variant="caution">
                      <Button
                        variant="dropdown-item"
                        onClick={async () => {
                          if (!sp.id) {
                            toast.error("Invalid product", {
                              description: "Product ID is missing",
                            })
                            return
                          }

                          const priorityStr = window.prompt("Enter priority (0-5):", "5")
                          const priorityNum = priorityStr ? parseInt(priorityStr) : null
                          if (priorityNum === null || isNaN(priorityNum) || priorityNum < 0 || priorityNum > 5) {
                            toast.error("Invalid priority", {
                              description: "Priority must be a number between 0 and 5",
                            })
                            return
                          }

                          updatePriority.mutate({ storeProductId: sp.id, priority: priorityNum })
                        }}
                        disabled={updatePriority.isPending}
                      >
                        Set priority
                        <MicroscopeIcon />
                      </Button>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild variant="caution">
                      <Button
                        variant="dropdown-item"
                        onClick={async () => {
                          if (!sp.id) {
                            toast.error("Invalid product", {
                              description: "Product ID is missing",
                            })
                            return
                          }

                          updatePriority.mutate({ storeProductId: sp.id, priority: null })
                        }}
                        disabled={updatePriority.isPending}
                      >
                        Clear priority
                        <CircleIcon />
                      </Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1">
            <ProductChart
              sp={sp}
              options={{
                showPricesVariationCard: true,
                showImage: false,
              }}
            />
          </div>
        </div>
      </div>

      <Separator className="my-6" />
      <IdenticalStoreProducts id={storeProductId} limit={10} />
      <Separator className="my-8" />
      <RelatedStoreProducts id={storeProductId} limit={20} />
    </div>
  )
}
