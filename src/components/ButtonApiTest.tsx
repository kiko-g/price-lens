"use client"

import { Button } from "@/components/ui/button"
import { AppWindowMacIcon } from "lucide-react"

async function handleFetch() {
  try {
    const url = "https://www.continente.pt/produto/gelado-baunilha-e-brownie-de-caramelo-haagen-dazs-7931544.html"
    const response = await fetch(`/api/product?url=${url}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.debug(data)
  } catch (error) {
    console.error("Error fetching the product:", error)
  }
}

export function ButtonApiTest() {
  return (
    <Button onClick={() => handleFetch()}>
      <AppWindowMacIcon />
      Test API
    </Button>
  )
}
