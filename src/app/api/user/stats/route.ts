import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { priceBeforeFromChangeRatio } from "@/lib/business/price-change"

/**
 * User stats & savings estimate.
 * Calculates estimated savings based on price changes of favorited products.
 */
export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [favoritesResult, alertsResult, achievementsResult, activityResult] = await Promise.all([
    supabase
      .from("user_favorites")
      .select("store_product_id, store_products (price, price_change_pct)")
      .eq("user_id", user.id),
    supabase
      .from("price_alert_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("user_achievements")
      .select("achievement_key, unlocked_at")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false }),
    supabase
      .from("user_activity_log")
      .select("activity_date")
      .eq("user_id", user.id)
      .eq("activity_type", "daily_visit")
      .order("activity_date", { ascending: false })
      .limit(30),
  ])

  // Calculate estimated savings from favorites
  let estimatedSavings = 0
  let productsWithDrops = 0
  const favorites = favoritesResult.data || []

  for (const fav of favorites) {
    const product = fav.store_products as unknown as { price: number; price_change_pct: number | null }
    if (
      product?.price != null &&
      product.price > 0 &&
      product.price_change_pct != null &&
      product.price_change_pct < 0
    ) {
      const priceBefore = priceBeforeFromChangeRatio(product.price, product.price_change_pct)
      if (priceBefore != null) {
        estimatedSavings += priceBefore - product.price
        productsWithDrops++
      }
    }
  }

  // Calculate streak
  const activityDates = (activityResult.data || []).map((a) => a.activity_date)
  let streak = 0
  const today = new Date().toISOString().split("T")[0]

  if (activityDates.length > 0) {
    const sortedDates = [...activityDates].sort().reverse()
    if (sortedDates[0] === today || sortedDates[0] === getPreviousDate(today)) {
      streak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        if (sortedDates[i] === getPreviousDate(sortedDates[i - 1])) {
          streak++
        } else {
          break
        }
      }
    }
  }

  return NextResponse.json({
    favorites_count: favorites.length,
    alerts_count: alertsResult.count || 0,
    estimated_savings: Math.round(estimatedSavings * 100) / 100,
    products_with_drops: productsWithDrops,
    streak,
    achievements: (achievementsResult.data || []).map((a) => a.achievement_key),
  })
}

function getPreviousDate(dateStr: string): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split("T")[0]
}
