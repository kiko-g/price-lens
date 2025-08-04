import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { favoriteQueries } from "@/lib/db/queries/favorites"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  try {
    const { user_id } = await params
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return NextResponse.json({ count: 0, error: "Unauthorized" }, { status: 401 })

    if (user.id !== user_id) return NextResponse.json({ count: 0, error: "Forbidden" }, { status: 403 })

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
