/**
 * Export category_mappings from local DB to a SQL migration file.
 * Use after mapping categories locally to generate a migration you can run in production.
 *
 * Usage:
 *   pnpm tsx scripts/export-category-mappings.ts
 *   pnpm tsx scripts/export-category-mappings.ts --prod   # export from production instead
 *
 * Output: scripts/migrations/029_category_mappings_export.sql
 */

import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

const useProd = process.argv.includes("--prod")
const envFile = useProd ? ".env.production" : ".env.local"
const envPath = path.resolve(process.cwd(), envFile)

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim()
      let value = trimmed.slice(eqIndex + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''")
}

async function main() {
  console.log(`Exporting category_mappings from ${useProd ? "production" : "local"} DB...`)

  const allMappings: Array<{
    origin_id: number
    store_category: string
    store_category_2: string | null
    store_category_3: string | null
    canonical_category_id: number
  }> = []

  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from("category_mappings")
      .select("origin_id, store_category, store_category_2, store_category_3, canonical_category_id")
      .order("origin_id", { ascending: true })
      .order("store_category", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("Failed to fetch mappings:", error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    allMappings.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  console.log(`Found ${allMappings.length} category mappings`)

  if (allMappings.length === 0) {
    console.log("No mappings to export.")
    return
  }

  // Also export canonical_categories governance state (tracked + default_priority)
  const allGovernance: Array<{
    id: number
    name: string
    tracked: boolean
    default_priority: number
  }> = []

  offset = 0
  while (true) {
    const { data, error } = await supabase
      .from("canonical_categories")
      .select("id, name, tracked, default_priority")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("Failed to fetch categories:", error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    allGovernance.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  const lines: string[] = [
    "-- Auto-generated: category mappings + governance export",
    `-- Source: ${useProd ? "production" : "local"} DB`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total mappings: ${allMappings.length}`,
    "",
    "-- ============================================================================",
    "-- 1. Category governance (tracked + default_priority)",
    "-- ============================================================================",
    "",
  ]

  for (const cat of allGovernance) {
    lines.push(
      `UPDATE canonical_categories SET tracked = ${cat.tracked}, default_priority = ${cat.default_priority} WHERE id = ${cat.id}; -- ${escapeSQL(cat.name)}`,
    )
  }

  lines.push(
    "",
    "-- ============================================================================",
    "-- 2. Category mappings (upsert)",
    "-- ============================================================================",
    "",
    "-- Clear existing mappings and re-insert (idempotent)",
    "DELETE FROM category_mappings;",
    "",
  )

  for (const m of allMappings) {
    const cat2 = m.store_category_2 ? `'${escapeSQL(m.store_category_2)}'` : "NULL"
    const cat3 = m.store_category_3 ? `'${escapeSQL(m.store_category_3)}'` : "NULL"
    lines.push(
      `INSERT INTO category_mappings (origin_id, store_category, store_category_2, store_category_3, canonical_category_id) VALUES (${m.origin_id}, '${escapeSQL(m.store_category)}', ${cat2}, ${cat3}, ${m.canonical_category_id});`,
    )
  }

  lines.push("")

  const outputPath = path.resolve(process.cwd(), "scripts/migrations/029_category_mappings_export.sql")
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8")
  console.log(`Written to ${outputPath}`)
  console.log(`  ${allGovernance.length} governance rows`)
  console.log(`  ${allMappings.length} mapping rows`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
