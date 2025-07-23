"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Scrapers = {
  name: string
  url: string
  result: any
}

export function TestScrapers() {
  const [scrapers, setScrapers] = useState<Scrapers[]>([
    {
      name: "Continente",
      url: "https://www.continente.pt/produto/pasta-de-dentes-sensibilidade-e-frescura-extra-sensodyne-6367523.html",
      result: null,
    },
    {
      name: "Auchan",
      url: "https://www.auchan.pt/pt/alimentacao/congelados/peixe/peixe-inteiro-e-posta/sardinha-nacional-peniche-congelada-800-g/2736681.html",
      result: null,
    },
  ])

  const handleTest = async (index: number, url: string) => {
    const scraper = scrapers[index]
    try {
      const response = await fetch("/api/admin/scrapers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scraperName: scraper.name, url }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const updatedScrapers = [...scrapers]
      updatedScrapers[index] = { ...scraper, result }
      setScrapers(updatedScrapers)
    } catch (error) {
      console.error(`Error testing ${scraper.name}:`, error)
    }
  }

  return (
    <div className="flex w-full flex-col space-y-16 p-4 md:p-12">
      {scrapers.map((scraper, index) => (
        <Card key={scraper.name} className="w-full">
          <CardHeader>
            <CardTitle>{scraper.name}</CardTitle>
            <CardDescription>Test the api scrapers and visualize the results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex w-full items-center gap-2">
              <Input placeholder={scraper.url} defaultValue={scraper.url} className="w-full" id={`url-${index}`} />
              <Button
                onClick={() => {
                  const input = document.getElementById(`url-${index}`) as HTMLInputElement
                  handleTest(index, input.value)
                }}
              >
                Test
              </Button>
            </div>
            {scraper.result && (
              <div className="mt-4">
                <pre className="overflow-auto rounded bg-gray-100 p-4 font-mono text-xs text-wrap">
                  {JSON.stringify(scraper.result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
