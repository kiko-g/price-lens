"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Code } from "@/components/ui/combo/code"

import { useTestScraper } from "@/hooks/useAdmin"
import { Loader2 } from "lucide-react"

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

  const testMutation = useTestScraper()

  const handleTest = (index: number, url: string) => {
    const scraper = scrapers[index]
    testMutation.mutate(
      { scraperName: scraper.name, url },
      {
        onSuccess: (result) => {
          const updatedScrapers = [...scrapers]
          updatedScrapers[index] = { ...scraper, result }
          setScrapers(updatedScrapers)
        },
        onError: (error) => {
          console.error(`Error testing ${scraper.name}:`, error)
          const updatedScrapers = [...scrapers]
          updatedScrapers[index] = {
            ...scraper,
            result: { error: error instanceof Error ? error.message : "Unknown error" },
          }
          setScrapers(updatedScrapers)
        },
      },
    )
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
              <Input
                placeholder={scraper.url}
                defaultValue={scraper.url}
                className="w-full text-base md:text-sm"
                id={`url-${index}`}
              />
              <Button
                onClick={() => {
                  const input = document.getElementById(`url-${index}`) as HTMLInputElement
                  handleTest(index, input.value)
                }}
                disabled={testMutation.isPending}
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Test
              </Button>
            </div>
            {scraper.result && (
              <div className="mt-4">
                <Code>{JSON.stringify(scraper.result, null, 2)}</Code>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
