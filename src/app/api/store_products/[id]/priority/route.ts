import { NextRequest, NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/queries/products"
import { invalidateSingleProductCache } from "@/lib/kv"

/**
 * PUT /api/store_products/[id]/priority
 *
 * Updates the priority of a store product.
 * Invalidates related caches on successful update.
 *
 * Request Body:
 * - priority: number (0-5) or null
 * - source: "manual" | "ai" (default: "manual")
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { priority, source = "manual" } = await request.json()

    const storeProductId = parseInt(id, 10)
    if (isNaN(storeProductId)) {
      return NextResponse.json({ error: "Invalid store product ID" }, { status: 400 })
    }

    if (priority !== null && priority !== undefined) {
      if (typeof priority !== "number" || !Number.isInteger(priority) || priority < 0 || priority > 5) {
        return NextResponse.json({ error: "Priority must be null or an integer between 0 and 5" }, { status: 400 })
      }
    }

    const validSource = source === "ai" || source === "manual" ? source : "manual"
    const priorityValue = priority === undefined ? null : priority
    const result = await storeProductQueries.updatePriority(storeProductId, priorityValue, {
      source: validSource,
    })

    if (result.error) {
      console.error("Error updating priority:", result.error)
      const status = "status" in result.error ? result.error.status : 500
      return NextResponse.json({ error: result.error.message || "Failed to update priority" }, { status })
    }

    // Invalidate single product cache
    await invalidateSingleProductCache(id)

    return NextResponse.json({
      message: "Priority updated successfully",
      data: result.data,
    })
  } catch (error) {
    console.error("Error in priority update route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
