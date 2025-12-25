import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { storeProductQueries } from "@/lib/db/queries/products"
import type { StoreProduct } from "@/types"

export const maxDuration = 60

function rowToPromptText(sp: Partial<StoreProduct>) {
  const categories = [sp.category, sp.category_2, sp.category_3]
    .filter(Boolean)
    .map((cat) => `(${cat})`)
    .join(" > ")

  return [`Name: ${sp.name}`, `Categories: ${categories}`, `Brand: ${sp.brand}`].join(" | ")
}

/**
 * AI Priority Classifier
 *
 * This endpoint fetches products with NO priority (null) or optionally a specific priority,
 * sends them to an LLM to determine their importance (0-5),
 * and updates the database.
 *
 * Query params:
 * - includePriority: number (0-5) - Also fetch products with this priority for re-classification
 * - batchSize: number (1-200) - Number of products to process in this batch (default: 50)
 *
 * Recommended usage: Schedule this to run every 10-15 minutes to process backlog.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const includePriority = searchParams.get("includePriority")
    const batchSizeParam = searchParams.get("batchSize")

    const limit = batchSizeParam ? Math.min(Math.max(parseInt(batchSizeParam, 10), 1), 200) : 50
    const offset = 0

    // 1. Fetch unprioritized products (or specific priority for re-classification)
    let batch = []
    let error = null
    let priority = null

    if (includePriority !== null) {
      priority = parseInt(includePriority, 10)
      if (isNaN(priority) || priority < 0 || priority > 5) {
        return NextResponse.json({ error: "includePriority must be between 0 and 5" }, { status: 400 })
      }

      const result = await storeProductQueries.getAllByPriority(priority, {
        offset,
        limit,
        excludeRecentlyClassified: false,
        recentThresholdDays: 30,
        excludeManual: true,
      })

      batch = result.data || []
      error = result.error
    } else {
      const result = await storeProductQueries.getAllNullPriority({ offset, limit })
      batch = result.data || []
      error = result.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    if (!batch || batch.length === 0) {
      return NextResponse.json({
        count: 0,
        message:
          includePriority === null ? "No unprioritized products found" : `No products with priority ${priority} found`,
      })
    }

    // 2. Prepare prompt
    const promptList = batch.map((p) => `${p.id}: ${rowToPromptText(p)}`).join("\n")

    const systemPrompt = `
You are a supermarket product prioritizer. Assign a priority from 0 to 5 to each product based on how essential/relevant and frequently purchased it is.

- 0 = very niche, rare, or non-food items (books, clothing, specialized tools, decorative)
- 1 = rarely bought (toys, games, seasonal non-food)
- 2 = occasionally bought (specialty ingredients, things bought once/twice a year)
- 3 = moderately recurring (sauces, specific spices, snacks, cleaning products)
- 4 = frequently bought but optional (soda, cereal, butter, beer, chocolate, cookies)
- 5 = essentials/staples (bread, milk, eggs, rice, pasta, fresh produce, water, meat, fish)

Create a JSON array like:
[
  { "id": 123, "priority": 5 },
  ...
]

Only return the JSON.
Here is the list (Format: "ID: Details"):
${promptList}
    `.trim()

    // 3. Call LLM
    const { text } = await generateText({
      model: openai("gpt-4.1-mini"),
      prompt: systemPrompt,
      temperature: 0.1, // Lower temperature for more consistent JSON
    })

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    // 4. Parse and Update
    let parsedItems = []
    try {
      parsedItems = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Error parsing LLM output:", parseError, "\nRaw output:", cleanedText)
      return NextResponse.json({ error: "Failed to parse LLM response", raw: cleanedText }, { status: 500 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { id: number; error: unknown }[],
      changed: {
        count: 0,
        list: [] as { id: number; name: string; oldPriority: number | null; newPriority: number }[],
      },
      unchanged: {
        count: 0,
        list: [] as { id: number; name: string; oldPriority: number | null; newPriority: number }[],
      },
    }

    // Create a map of batch products for quick lookup
    const batchMap = new Map(batch.map((p) => [p.id, { name: p.name, oldPriority: p.priority }]))

    // Update in parallel
    await Promise.all(
      parsedItems.map(async (item: { id: number; priority: number }) => {
        // Validate priority
        if (typeof item.priority !== "number" || item.priority < 0 || item.priority > 5) {
          results.failed++
          return
        }

        const productInfo = batchMap.get(item.id)

        // Handle case where product isn't found in batch map
        if (!productInfo) {
          results.failed++
          results.errors.push({ id: item.id, error: "Product ID not found in batch" })
          return
        }

        const oldPriority = productInfo.oldPriority
        const priorityChanged = oldPriority !== item.priority

        // DB Operations
        if (priorityChanged) {
          const { error: updateError } = await storeProductQueries.updatePriority(item.id, item.priority, {
            updateTimestamp: true,
            source: "ai",
          })

          if (updateError) {
            results.failed++
            results.errors.push({ id: item.id, error: updateError })
            return
          }
        } else {
          // Priority unchanged, just update timestamp and mark as AI-reviewed
          const { error: timestampError } = await storeProductQueries.updatePriorityTimestamp(item.id, "ai")

          if (timestampError) {
            results.failed++
            results.errors.push({ id: item.id, error: timestampError })
            return
          }
        }

        // Success: Sort into specific result lists
        results.success++

        const resultEntry = {
          id: item.id,
          name: productInfo.name || "Unknown",
          oldPriority: oldPriority ?? null,
          newPriority: item.priority,
        }

        if (priorityChanged) {
          results.changed.list.push(resultEntry)
          results.changed.count++
        } else {
          results.unchanged.list.push(resultEntry)
          results.unchanged.count++
        }
      }),
    )

    return NextResponse.json({
      message: `Processed ${batch.length} products`,
      results,
    })
  } catch (error) {
    console.error("Error in classify-priority route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
