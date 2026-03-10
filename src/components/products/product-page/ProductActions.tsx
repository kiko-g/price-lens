"use client"

import type { StoreProduct } from "@/types"
import { useUser } from "@/hooks/useUser"
import { useSetProductPriority } from "@/hooks/useSetProductPriority"
import { useUpdateStoreProduct } from "@/hooks/useProducts"
import { getSupermarketChainName } from "@/components/products/SupermarketChainBadge"

import { Button } from "@/components/ui/button"
import { ShareButton } from "@/components/ui/combo/share-button"
import { CodeShowcase } from "@/components/ui/combo/code-showcase"
import { DevBadge } from "@/components/ui/combo/dev-badge"
import { DrawerSheet } from "@/components/ui/combo/drawer-sheet"
import { ResponsiveActionsMenu, ResponsiveActionsMenuItem } from "@/components/ui/combo/responsive-actions-menu"
import { LoadingIcon } from "@/components/icons/LoadingIcon"
import { FavoriteButton } from "@/components/products/product-page/FavoriteButton"

import { EllipsisVerticalIcon, RefreshCcwIcon, MicroscopeIcon, CircleIcon, InfoIcon } from "lucide-react"

interface ProductActionsProps {
  sp: StoreProduct
}

export function ProductActions({ sp }: ProductActionsProps) {
  const { profile } = useUser()
  const updateStoreProduct = useUpdateStoreProduct()
  const { promptAndSetPriority, clearPriority, isPending: isPriorityPending } = useSetProductPriority(sp.id)

  const supermarketName = getSupermarketChainName(sp?.origin_id)
  const elevated = process.env.NODE_ENV === "development" || profile?.role === "admin"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FavoriteButton storeProduct={sp} />
      <ShareButton sp={sp} />
      <ResponsiveActionsMenu
        trigger={
          <Button variant="outline" size="icon-sm">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        }
      >
        <ResponsiveActionsMenuItem asChild>
          <DrawerSheet
            title="Details"
            description="Inspect store product data"
            trigger={
              <button type="button" className="flex w-full items-center justify-between gap-2">
                Store product details
                <InfoIcon />
              </button>
            }
          >
            <div className="w-full">
              <CodeShowcase code={JSON.stringify(sp, null, 2)} language="json" />
            </div>
          </DrawerSheet>
        </ResponsiveActionsMenuItem>

        <ResponsiveActionsMenuItem
          onClick={() => updateStoreProduct.mutate(sp)}
          disabled={updateStoreProduct.isPending}
        >
          <span className="flex items-center gap-1">
            Update from {supermarketName}
            <DevBadge />
          </span>
          {updateStoreProduct.isPending ? <LoadingIcon /> : <RefreshCcwIcon />}
        </ResponsiveActionsMenuItem>

        {elevated && (
          <ResponsiveActionsMenuItem onClick={promptAndSetPriority} disabled={isPriorityPending}>
            <span className="flex items-center gap-1">
              Set priority
              <DevBadge />
            </span>
            <MicroscopeIcon />
          </ResponsiveActionsMenuItem>
        )}

        {elevated && (
          <ResponsiveActionsMenuItem onClick={clearPriority} disabled={isPriorityPending}>
            <span className="flex items-center gap-1">
              Clear priority
              <DevBadge />
            </span>
            <CircleIcon />
          </ResponsiveActionsMenuItem>
        )}
      </ResponsiveActionsMenu>
    </div>
  )
}
