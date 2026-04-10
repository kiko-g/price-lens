"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { STORE_NAMES } from "@/types/business"

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
        setError("Could not load shopping lists")
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleCreateList = async () => {
    const name = newListName.trim() || "My List"
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setNewListName("")
      fetchLists()
      toast.success(`Created "${name}"`)
    }
  }

  const handleDeleteList = async (listId: number) => {
    await fetch("/api/lists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: listId }),
    })
    fetchLists()
    toast.success("List deleted")
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
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create list */}
      <div className="flex gap-2">
        <Input
          placeholder="New list name..."
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
          className="flex-1"
        />
        <Button onClick={handleCreateList} size="sm">
          <PlusIcon className="mr-1 size-4" />
          Create
        </Button>
      </div>

      {lists.length === 0 ? (
        <EmptyStateView
          icon={ListIcon}
          title="No shopping lists yet"
          message='Create a list above and add products from any product page using the "Add to list" action.'
        />
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
            {checkedCount}/{items.length} checked
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">{total.toFixed(2)}€</span>
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
          <p className="text-muted-foreground py-4 text-center text-xs">
            No items yet. Add products from product pages.
          </p>
        ) : (
          <>
            {items.map((item) => {
              const product = item.store_products
              if (!product) return null
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
                      <span className="text-muted-foreground text-[10px]">
                        {item.quantity > 1 && `${item.quantity}x `}
                        {product.price.toFixed(2)}€
                      </span>
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
                <p className="text-muted-foreground text-[10px] font-medium uppercase">Cost by store</p>
                {Array.from(byStore.entries()).map(([originId, storeTotal]) => (
                  <div key={originId} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <SupermarketChainBadge originId={originId} variant="logoSmall" />
                      <span className="text-xs">{STORE_NAMES[originId]}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums">{storeTotal.toFixed(2)}€</span>
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
