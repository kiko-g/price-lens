"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import type { StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
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
import { AlertButton } from "@/components/products/product-page/AlertButton"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { EllipsisVerticalIcon, RefreshCcwIcon, MicroscopeIcon, CircleIcon, InfoIcon } from "lucide-react"

interface ProductActionsProps {
  sp: StoreProduct
}

export function ProductActions({ sp }: ProductActionsProps) {
  const { profile } = useUser()
  const updateStoreProduct = useUpdateStoreProduct()
  const { promptAndSetPriority, clearPriority, isPending: isPriorityPending } = useSetProductPriority(sp.id)
  const compactActions = useMediaQuery("(max-width: 768px)")
  const t = useTranslations("products.actions")
  const [storeDetailsOpen, setStoreDetailsOpen] = useState(false)

  const supermarketName = getSupermarketChainName(sp?.origin_id) ?? ""
  const elevated = process.env.NODE_ENV === "development" || profile?.role === "admin"

  return (
    <div className={cn("flex flex-wrap items-center gap-3 md:gap-2", compactActions && "w-full justify-between")}>
      <div className="flex items-center gap-3">
        <FavoriteButton storeProduct={sp} compact={compactActions} />
        <AlertButton storeProductId={sp.id} productName={sp.name} variant={compactActions ? "icon" : "default"} />
        <ShareButton sp={sp} compact={compactActions} />
      </div>
      <div className="flex items-center gap-3">
        <ResponsiveActionsMenu
          title={t("menuTitle")}
          trigger={
            <Button variant="outline" size={compactActions ? "icon-lg" : "icon-sm"}>
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
          }
        >
          <ResponsiveActionsMenuItem onClick={() => setStoreDetailsOpen(true)}>
            <span className="flex w-full min-w-0 items-center justify-between gap-2">
              {t("storeProductDetails")}
            </span>
            <InfoIcon />
          </ResponsiveActionsMenuItem>

          <ResponsiveActionsMenuItem
            onClick={() => updateStoreProduct.mutate(sp)}
            disabled={updateStoreProduct.isPending}
          >
            <span className="flex w-full items-center gap-1">
              <span>{t("updateFrom", { store: supermarketName })}</span>
              <DevBadge />
            </span>
            {updateStoreProduct.isPending ? <LoadingIcon /> : <RefreshCcwIcon />}
          </ResponsiveActionsMenuItem>

          {elevated && (
            <ResponsiveActionsMenuItem onClick={promptAndSetPriority} disabled={isPriorityPending}>
              <span className="flex w-full items-center gap-1">
                <span>{t("setPriority")}</span>
                <DevBadge />
              </span>
              <MicroscopeIcon />
            </ResponsiveActionsMenuItem>
          )}

          {elevated && (
            <ResponsiveActionsMenuItem onClick={clearPriority} disabled={isPriorityPending}>
              <span className="flex w-full items-center gap-1">
                <span>{t("clearPriority")}</span>
                <DevBadge />
              </span>
              <CircleIcon />
            </ResponsiveActionsMenuItem>
          )}
        </ResponsiveActionsMenu>

        <DrawerSheet
          open={storeDetailsOpen}
          onOpenChange={setStoreDetailsOpen}
          title={t("details")}
          description={t("inspectData")}
          trigger={null}
        >
          <div className="w-full">
            <CodeShowcase code={JSON.stringify(sp, null, 2)} language="json" />
          </div>
        </DrawerSheet>
      </div>
    </div>
  )
}
