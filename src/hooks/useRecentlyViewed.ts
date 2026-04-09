"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "price-lens:recently-viewed"
const MAX_ITEMS = 20

export interface RecentlyViewedItem {
  id: number
  name: string
  brand: string | null
  image: string | null
  price: number
  origin_id: number
  viewedAt: number
}

function getStored(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentlyViewedItem => typeof item === "object" && item !== null && typeof item.id === "number",
    )
  } catch {
    return []
  }
}

function setStored(items: RecentlyViewedItem[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage full or unavailable
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    setItems(getStored())
  }, [])

  const addItem = useCallback(
    (product: {
      id: number
      name: string
      brand: string | null
      image: string | null
      price: number
      origin_id: number
    }) => {
      setItems((prev) => {
        const filtered = prev.filter((item) => item.id !== product.id)
        const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
        setStored(updated)
        return updated
      })
    },
    [],
  )

  const clearAll = useCallback(() => {
    setItems([])
    setStored([])
  }, [])

  return {
    items,
    addItem,
    clearAll,
    hasItems: items.length > 0,
  }
}
