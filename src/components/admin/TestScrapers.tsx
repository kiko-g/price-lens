"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  const [aiResult, setAiResult] = useState<any>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<string>("null")

  const handleTestAi = async () => {
    setIsAiLoading(true)
    setAiResult(null)
    try {
      const url = `/api/scrape/ai-priority${selectedPriority === "null" ? "" : `?includePriority=${selectedPriority}`}`
      const response = await fetch(url)
      const result = await response.json()
      setAiResult(result)
    } catch (error) {
      console.error("Error testing AI:", error)
      setAiResult({ error: "Failed to fetch" })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleTest = async (index: number, url: string) => {
    const scraper = scrapers[index]
    try {
      // TODO: Replace api route here
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Priority Classifier</CardTitle>
          <CardDescription>Test the AI priority classification for products (Batch of 50)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center gap-2">
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Null (Unprioritized)</SelectItem>
                <SelectItem value="0">Priority 0 (Niche)</SelectItem>
                <SelectItem value="1">Priority 1 (Rare)</SelectItem>
                <SelectItem value="2">Priority 2 (Occasional)</SelectItem>
                <SelectItem value="3">Priority 3 (Moderate)</SelectItem>
                <SelectItem value="4">Priority 4 (Frequent)</SelectItem>
                <SelectItem value="5">Priority 5 (Essential)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleTestAi} disabled={isAiLoading}>
              {isAiLoading ? "Processing..." : "Run AI Classification"}
            </Button>
          </div>
          {aiResult && (
            <div className="mt-4 space-y-3">
              {aiResult.results?.updated && (
                <div className="border-border bg-muted rounded border p-3 text-sm">
                  <p>
                    <strong>Success:</strong> {aiResult.results.success} | <strong>Failed:</strong>{" "}
                    {aiResult.results.failed}
                  </p>
                  <p>
                    <strong>Changed:</strong> {aiResult.results.updated.filter((item: any) => item.changed).length} |{" "}
                    <strong>Unchanged:</strong>{" "}
                    {aiResult.results.updated.filter((item: any) => item.changed === false).length}
                  </p>
                </div>
              )}
              <pre className="overflow-auto rounded bg-gray-100 p-4 font-mono text-xs text-wrap">
                {JSON.stringify(aiResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
