/**
 * Script to delete invalid redirect URL products
 * Run with: pnpm tsx scripts/delete-redirect-urls.ts
 */

import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      const value = valueParts.join("=").replace(/^["']|["']$/g, "")
      if (key && !process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function deleteRedirectUrls() {
  // Find all products with the redirect URL pattern
  const { data: products, error } = await supabase
    .from("store_products")
    .select("id, url")
    .like("url", "%/s/Sites-continente-Site/dw/shared_session_redirect%")

  if (error) {
    console.error("Error finding products:", error)
    return
  }

  console.log(`Found ${products.length} redirect URLs to delete`)

  if (products.length === 0) {
    console.log("✅ No redirect URLs found - already clean!")
    return
  }

  const ids = products.map((p) => p.id)
  console.log("IDs:", ids.join(", "))

  // Delete prices first
  const { error: priceError } = await supabase.from("prices").delete().in("store_product_id", ids)

  if (priceError) {
    console.error("Error deleting prices:", priceError)
  } else {
    console.log("Deleted associated prices")
  }

  // Delete the products
  const { error: deleteError } = await supabase.from("store_products").delete().in("id", ids)

  if (deleteError) {
    console.error("Error deleting products:", deleteError)
  } else {
    console.log(`✅ Deleted ${products.length} invalid redirect products`)
  }
}

deleteRedirectUrls()
