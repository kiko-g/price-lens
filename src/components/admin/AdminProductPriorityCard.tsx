"use client"

import { useState } from "react"
import { type StoreProduct } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { updateProductPriority } from "@/app/admin/priorities/actions"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  product: StoreProduct
  onUpdate: (product: StoreProduct) => void
}

const priorityLabels: Record<number, string> = {
  0: "Niche",
  1: "Rare",
  2: "Occasional",
  3: "Moderate",
  4: "Frequent",
  5: "Essential",
}

const priorityColors: Record<number, string> = {
  0: "bg-gray-500",
  1: "bg-blue-500",
  2: "bg-cyan-500",
  3: "bg-green-500",
  4: "bg-yellow-500",
  5: "bg-red-500",
}

function resolveImageUrlForCard(image: string, size = 300) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  return url.toString()
}

export function AdminProductPriorityCard({ product, onUpdate }: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const supermarketName = getSupermarketChainName(product.origin_id)

  const handlePriorityChange = async (value: string) => {
    if (value === "null") return

    const newPriority = parseInt(value)
    if (isNaN(newPriority) || newPriority < 0 || newPriority > 5) return

    setIsUpdating(true)
    try {
      const result = await updateProductPriority(product.id, newPriority)

      if (result.success) {
        onUpdate({ ...product, priority: newPriority, priority_source: "manual" })
      } else {
        console.error("Failed to update priority:", result.error)
      }
    } catch (err) {
      console.error("Error updating priority:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
          {product.image ? (
            <Image
              src={resolveImageUrlForCard(product.image, 300)}
              alt={product.name || "Product"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}

          {/* Supermarket Badge */}
          {supermarketName && (
            <div className="absolute top-1 right-1">
              <Badge variant="secondary" className="text-xs">
                {supermarketName}
              </Badge>
            </div>
          )}

          {/* Current Priority Badge */}
          {product.priority !== null && product.priority !== undefined && (
            <div className="absolute top-1 left-1">
              <Badge
                variant="secondary"
                className={cn("text-xs font-semibold text-white", priorityColors[product.priority])}
              >
                P{product.priority}
              </Badge>
            </div>
          )}
        </div>

        {/* Product Name */}
        <div className="min-h-[40px]">
          <p className="line-clamp-2 text-xs leading-tight font-medium">{product.name}</p>
        </div>

        {/* Priority Selector */}
        <Select
          value={product.priority?.toString() || "null"}
          onValueChange={handlePriorityChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full text-xs">
            <SelectValue placeholder="Set priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null" disabled>
              <span className="text-muted-foreground">Not set</span>
            </SelectItem>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", priorityColors[parseInt(value)])} />
                  <span>
                    {value} - {label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source Indicator */}
        {product.priority_source && (
          <div className="text-muted-foreground flex items-center justify-between text-[10px]">
            <span>Source: {product.priority_source}</span>
            {product.priority_updated_at && (
              <span className="text-muted-foreground/70">
                {new Date(product.priority_updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
