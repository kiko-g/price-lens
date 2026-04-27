"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { STORE_NAMES } from "@/types/business"
import { isLocale, type Locale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"
import { MULTIPLY_SIGN } from "@/lib/i18n/formatting-glyphs"

import { EmptyStateView } from "@/components/ui/combo/state-views"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"

import { ListIcon, PlusIcon, TrashIcon, PackageIcon, ShoppingCartIcon } from "lucide-react"
import { toast } from "sonner"

interface ListProduct {
  id: number
  name: string
  brand: string | null
  image: string | null
  price: number
  origin_id: number
  available: boolean
}

interface ListItem {
  id: number
  store_product_id: number
  quantity: number
  checked: boolean
  store_products: ListProduct
}

interface ShoppingList {
  id: number
  name: string
  created_at: string
  shopping_list_items: ListItem[]
}

export function ListsTab() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newListName, setNewListName] = useState("")
  const t = useTranslations("profile.listsTab")

  const fetchLists = useCallback(() => {
    setError(null)
    fetch("/api/lists")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setLists(data.lists || [])
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("[ListsTab] failed to load lists:", err)
        setError(t("loadError"))
        setIsLoading(false)
      })
  }, [t])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleCreateList = async () => {
    const name = newListName.trim() || t("newListDefaultName")
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setNewListName("")
      fetchLists()
      toast.success(t("createdToast", { name }))
    }
  }

  const handleDeleteList = async (listId: number) => {
    await fetch("/api/lists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: listId }),
    })
    fetchLists()
    toast.success(t("deletedToast"))
  }

  const handleToggleItem = async (itemId: number, checked: boolean) => {
    await fetch("/api/lists/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, checked }),
    })
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        shopping_list_items: list.shopping_list_items.map((item) => (item.id === itemId ? { ...item, checked } : item)),
      })),
    )
  }

  const handleDeleteItem = async (itemId: number) => {
    await fetch("/api/lists/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    })
    fetchLists()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive py-8 text-center text-sm">
        {error}
        <button onClick={fetchLists} className="mt-2 block w-full text-xs underline">
          {t("tryAgain")}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create list */}
      <div className="flex gap-2">
        <Input
          placeholder={t("newListPlaceholder")}
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
          className="flex-1"
        />
        <Button onClick={handleCreateList} size="sm">
          <PlusIcon className="mr-1 size-4" />
          {t("createButton")}
        </Button>
      </div>

      {lists.length === 0 ? (
        <EmptyStateView icon={ListIcon} title={t("emptyTitle")} message={t("emptyMessage")} />
      ) : (
        lists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onDeleteList={handleDeleteList}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
          />
        ))
      )}
    </div>
  )
}

function ShoppingListCard({
  list,
  onDeleteList,
  onToggleItem,
  onDeleteItem,
}: {
  list: ShoppingList
  onDeleteList: (id: number) => void
  onToggleItem: (id: number, checked: boolean) => void
  onDeleteItem: (id: number) => void
}) {
  const items = list.shopping_list_items || []
  const checkedCount = items.filter((i) => i.checked).length
  const total = items.reduce((sum, item) => {
    if (!item.store_products) return sum
    return sum + item.store_products.price * item.quantity
  }, 0)

  const t = useTranslations("profile.listsTab")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  // Per-store totals for price optimization
  const byStore = new Map<number, number>()
  for (const item of items) {
    if (!item.store_products) continue
    const storeTotal = byStore.get(item.store_products.origin_id) || 0
    byStore.set(item.store_products.origin_id, storeTotal + item.store_products.price * item.quantity)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingCartIcon className="text-muted-foreground size-4" />
          {list.name}
          <span className="text-muted-foreground text-xs font-normal">
            {t("checkedRatio", { checked: checkedCount, total: items.length })}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">{formatPrice(total, locale)}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeleteList(list.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 p-4 pt-0">
        {items.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">{t("noItems")}</p>
        ) : (
          <>
            {items.map((item) => {
              const product = item.store_products
              if (!product) return null
              const listPriceLine =
                item.quantity > 1
                  ? `${item.quantity}${MULTIPLY_SIGN} ${formatPrice(product.price, locale)}`
                  : formatPrice(product.price, locale)
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-opacity",
                    item.checked && "opacity-50",
                  )}
                >
                  <Checkbox checked={item.checked} onCheckedChange={(checked) => onToggleItem(item.id, !!checked)} />
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border bg-white">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-0.5"
                        sizes="32px"
                        unoptimized
                      />
                    ) : (
                      <PackageIcon className="text-muted-foreground size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-xs font-medium", item.checked && "line-through")}>{product.name}</p>
                    <div className="flex items-center gap-1">
                      <SupermarketChainBadge originId={product.origin_id} variant="logoSmall" />
                      <span className="text-muted-foreground text-[10px]">{listPriceLine}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeleteItem(item.id)}
                    className="text-muted-foreground hover:text-destructive size-6"
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </div>
              )
            })}

            {/* Per-store cost breakdown */}
            {byStore.size > 1 && (
              <div className="border-border mt-2 space-y-1 border-t pt-2">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">{t("costByStore")}</p>
                {Array.from(byStore.entries()).map(([originId, storeTotal]) => (
                  <div key={originId} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <SupermarketChainBadge originId={originId} variant="logoSmall" />
                      <span className="text-xs">{STORE_NAMES[originId]}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums">{formatPrice(storeTotal, locale)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
