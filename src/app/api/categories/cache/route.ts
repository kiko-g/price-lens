import { clearCategoriesCache } from "@/lib/kv"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(req: NextRequest) {
  try {
    await clearCategoriesCache()
    return NextResponse.json({ message: "Categories cache cleared successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error clearing categories cache:", error)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}
