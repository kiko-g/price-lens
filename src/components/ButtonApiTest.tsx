"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AppWindowMacIcon } from "lucide-react"

async function playground(index: number) {
  const response = await fetch(`/api/product/list?index=${index}`, {
    method: "GET",
  })
  const data = await response.json()

  if (data.url) {
    const productResponse = await fetch(`/api/product?url=${data.url}`, {
      method: "GET",
    })
    const product = await productResponse.json()
    console.debug(product)
  }
}

export function ButtonApiTest() {
  const [index, setIndex] = useState(0)

  return (
    <div className="flex w-full max-w-md items-center justify-center gap-4">
      <Input type="number" value={index} onChange={(e) => setIndex(Number(e.target.value))} />
      <Button onClick={() => playground(index)} variant="outline">
        <AppWindowMacIcon />
        Test Scraper
      </Button>
    </div>
  )
}
