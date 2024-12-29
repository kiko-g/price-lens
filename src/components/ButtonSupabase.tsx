"use client"

import { Button } from "@/components/ui/button"
import { DatabaseIcon } from "lucide-react"

async function handleFetch() {
  if (process.env.NODE_ENV !== "development") return

  try {
    const response = await fetch(`/api/category`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.debug(data)
  } catch (error) {
    console.error("Error fetching the product:", error)
  }
}

export function ButtonSupabase() {
  // const supabase = createClient()
  // const { data: products } = await supabase.from("products").select("*")

  return (
    <Button onClick={() => handleFetch()}>
      <DatabaseIcon />
      Button Supabase
    </Button>
  )
}
