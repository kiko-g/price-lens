import { NextRequest, NextResponse } from "next/server"
import { favoriteQueries } from "@/lib/db/queries/favorites"
import { userQueries } from "@/lib/db/queries/user"

export async function POST(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()

    if (!store_product_id || typeof store_product_id !== "number") {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await favoriteQueries.addFavorite(user.id, store_product_id)

    if (error) {
      const status = error.code === "ALREADY_FAVORITED" ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in favorites POST route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()

    if (!store_product_id || typeof store_product_id !== "number") {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const { error } = await favoriteQueries.removeFavorite(user.id, store_product_id)

    if (error) {
      console.error("Error removing favorite:", error)
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in favorites DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const pagination = userQueries.createPaginationParams(req.nextUrl.searchParams)
    const result = await favoriteQueries.getUserFavoritesPaginated(user.id, pagination)

    if (result.error) {
      console.error("Error fetching favorites:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in favorites GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
