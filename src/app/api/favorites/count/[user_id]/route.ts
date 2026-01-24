import { NextRequest, NextResponse } from "next/server"
import { favoriteQueries } from "@/lib/queries/favorites"
import { userQueries } from "@/lib/queries/user"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  try {
    const { user_id } = await params

    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ count: 0, error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const { data: hasPermission, error: permissionError } = await userQueries.checkUserPermission(user.id, user_id)
    if (permissionError || !hasPermission) {
      return NextResponse.json({ count: 0, error: permissionError?.message || "Forbidden" }, { status: 403 })
    }

    const { count, error } = await favoriteQueries.getFavoritesCount(user_id, true)

    if (error) {
      console.error("Error getting favorites count:", error)
      return NextResponse.json({ count: 0, error: "Failed to get favorites count" }, { status: 500 })
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error in favorites count route:", error)
    return NextResponse.json({ count: 0, error: "Internal server error" }, { status: 500 })
  }
}
