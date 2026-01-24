import { NextRequest, NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/queries/products"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { priority } = await request.json()

    const storeProductId = parseInt(id, 10)
    if (isNaN(storeProductId)) {
      return NextResponse.json({ error: "Invalid store product ID" }, { status: 400 })
    }

    if (priority !== null && priority !== undefined) {
      if (typeof priority !== "number" || !Number.isInteger(priority) || priority < 0 || priority > 5) {
        return NextResponse.json({ error: "Priority must be null or an integer between 0 and 5" }, { status: 400 })
      }
    }

    const priorityValue = priority === undefined ? null : priority
    const result = await storeProductQueries.updatePriority(storeProductId, priorityValue)

    if (result.error) {
      console.error("Error updating priority:", result.error)
      const status = "status" in result.error ? result.error.status : 500
      return NextResponse.json({ error: result.error.message || "Failed to update priority" }, { status })
    }

    return NextResponse.json({
      message: "Priority updated successfully",
      data: result.data,
    })
  } catch (error) {
    console.error("Error in priority update route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
