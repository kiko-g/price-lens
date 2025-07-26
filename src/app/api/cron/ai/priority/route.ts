import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { storeProductQueries } from "@/lib/db/queries/products"

export const maxDuration = 60

function rowToPromptText(sp: any) {
  const categories = [sp.category, sp.category_2, sp.category_3]
    .filter(Boolean)
    .map((cat) => `(${cat})`)
    .join(" > ")

  return [`Name: ${sp.name}`, `Categories: ${categories}`, `Brand: ${sp.brand}`].join(" | ")
}

export async function GET() {
  try {
    const limit = 5
    const offset = 0
    const results: { id: string; name: string; priority: number }[] = [] // TODO: add results to db ?

    const { data: batch, error } = await storeProductQueries.getAllNullPriority({ offset, limit })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    const promptList = batch.map((p, i) => `${i + 1}. ${rowToPromptText(p)}`).join("\n")

    const systemPrompt = `
You are a supermarket product prioritizer. Assign a priority from 0 to 5 to each product based on how essential/relevant and frequently purchased it is.

- 0 = very niche or rare (books, clothing, tools, etc.)
- 1 = rarely bought (toys, games, etc.)
- 2 = occasionally bought (something that you buy maybe once/twice a year)
- 3 = moderately recurring (something SOMEONE might buy often, but not everyone: sauces, etc.)
- 4 = frequently bought but optional (most people buy often: soda, cereal, butter, beer, chocolate, etc.)
- 5 = frequently bought (99% people buy every week: bread, milk, eggs, etc.)

Create a JSON array like:
[
  { "id": xxx, "name": yyy, "priority": zzz },
  ...
]

Here is the list:
${promptList}
    `.trim()

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: systemPrompt,
      temperature: 0.5,
    })

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    try {
      const parsed = JSON.parse(cleanedText)
      return NextResponse.json({ data: parsed })
    } catch (parseError) {
      console.error("Error parsing LLM output for batch:", parseError, "\nRaw output:\n", cleanedText)
    }
  } catch (error) {
    console.error("Error in classify-priority route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
