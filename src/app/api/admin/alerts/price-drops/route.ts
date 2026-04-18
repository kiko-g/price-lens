import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getResend, FROM_EMAIL } from "@/lib/email/resend"
import { priceDropAlertHtml, priceDropAlertSubject } from "@/lib/email/templates"
import { siteConfig } from "@/lib/config"
import { STORE_NAMES } from "@/types/business"
import { generateProductSlug } from "@/lib/business/product"
import { priceBeforeFromChangeRatio, priceChangeRatioToPercentPoints } from "@/lib/business/price-change"

export const maxDuration = 60

/**
 * Process price drop alerts: find products that dropped in price since last check,
 * match against active subscriptions, send emails, and log events.
 * Called by cron after scrape batches complete.
 */
export async function POST() {
  const supabase = createAdminClient()
  const startTime = Date.now()

  // Get all active subscriptions with joined product + user data
  const { data: subscriptions, error: subError } = await supabase
    .from("price_alert_subscriptions")
    .select(
      `
      id, user_id, store_product_id, threshold_type, threshold_value,
      store_products (id, name, brand, price, price_change_pct, origin_id, image, available)
    `,
    )
    .eq("is_active", true)

  if (subError || !subscriptions) {
    return NextResponse.json({ error: subError?.message || "Failed to fetch subscriptions" }, { status: 500 })
  }

  // Filter to products that actually dropped
  const alertsToSend: Array<{
    subscription: (typeof subscriptions)[number]
    product: {
      id: number
      name: string
      brand: string | null
      price: number
      price_change_pct: number
      origin_id: number
      image: string | null
    }
  }> = []

  for (const sub of subscriptions) {
    const product = sub.store_products as unknown as {
      id: number
      name: string
      brand: string | null
      price: number
      price_change_pct: number | null
      origin_id: number
      image: string | null
      available: boolean
    }

    if (
      !product ||
      !product.available ||
      product.price_change_pct == null ||
      product.price_change_pct >= 0 ||
      product.price == null ||
      product.price <= 0
    )
      continue

    const changeRatioAbs = Math.abs(product.price_change_pct)

    if (sub.threshold_type === "any_drop") {
      alertsToSend.push({ subscription: sub, product: { ...product, price_change_pct: product.price_change_pct } })
    } else if (
      sub.threshold_type === "percentage" &&
      sub.threshold_value != null &&
      changeRatioAbs >= sub.threshold_value
    ) {
      alertsToSend.push({ subscription: sub, product: { ...product, price_change_pct: product.price_change_pct } })
    } else if (sub.threshold_type === "target_price" && sub.threshold_value && product.price <= sub.threshold_value) {
      alertsToSend.push({ subscription: sub, product: { ...product, price_change_pct: product.price_change_pct } })
    }
  }

  if (alertsToSend.length === 0) {
    return NextResponse.json({ message: "No alerts to send", processed: 0, duration_ms: Date.now() - startTime })
  }

  // Batch fetch user emails
  const userIds = [...new Set(alertsToSend.map((a) => a.subscription.user_id))]
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, locale").in("id", userIds)

  const { data: users } = await supabase.auth.admin.listUsers()
  const emailMap = new Map<string, string>()
  const nameMap = new Map<string, string>()
  const localeMap = new Map<string, string>()

  users?.users?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email)
  })
  profiles?.forEach((p) => {
    if (p.full_name) nameMap.set(p.id, p.full_name)
    if (p.locale) localeMap.set(p.id, p.locale)
  })

  let sent = 0
  let failed = 0
  const resend = getResend()

  for (const alert of alertsToSend) {
    const email = emailMap.get(alert.subscription.user_id)
    if (!email) continue

    const userName = nameMap.get(alert.subscription.user_id) || "there"
    const storeName = STORE_NAMES[alert.product.origin_id] || "Unknown Store"
    const userLocale = localeMap.get(alert.subscription.user_id)
    const oldPrice = priceBeforeFromChangeRatio(alert.product.price, alert.product.price_change_pct)
    if (oldPrice == null) continue
    const slug = generateProductSlug(alert.product)
    const productUrl = `${siteConfig.url}/products/${alert.product.id}-${slug}`

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: await priceDropAlertSubject(
          alert.product.name,
          priceChangeRatioToPercentPoints(alert.product.price_change_pct),
          userLocale,
        ),
        html: await priceDropAlertHtml({
          userName,
          productName: alert.product.name,
          productBrand: alert.product.brand,
          storeName,
          oldPrice,
          newPrice: alert.product.price,
          changePercent: priceChangeRatioToPercentPoints(alert.product.price_change_pct),
          productUrl,
          locale: userLocale,
        }),
      })

      // Log the event
      await supabase.from("alert_events").insert({
        subscription_id: alert.subscription.id,
        user_id: alert.subscription.user_id,
        store_product_id: alert.subscription.store_product_id,
        old_price: oldPrice,
        new_price: alert.product.price,
        price_change_pct: alert.product.price_change_pct,
        channel: "email",
      })

      sent++
    } catch (err) {
      console.error(`[AlertProcessor] Failed to send alert for product ${alert.product.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({
    message: `Processed ${alertsToSend.length} alerts`,
    sent,
    failed,
    duration_ms: Date.now() - startTime,
  })
}
