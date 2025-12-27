"use server"

import { storeProductQueries } from "@/lib/db/queries/products"
import { revalidatePath } from "next/cache"

export async function updateProductPriority(productId: number, priority: number) {
  if (priority < 0 || priority > 5 || !Number.isInteger(priority)) {
    return {
      success: false,
      error: "Priority must be an integer between 0 and 5",
    }
  }

  const { data, error } = await storeProductQueries.updatePriority(productId, priority, {
    updateTimestamp: true,
    source: "manual",
  })

  if (error) {
    console.error("Failed to update priority:", error)
    return {
      success: false,
      error: "Failed to update priority",
    }
  }

  revalidatePath("/admin/priorities")

  return {
    success: true,
    data,
  }
}

