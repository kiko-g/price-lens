"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AsyncTimerLoader } from "../ui/combo/async-timer-loader"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"

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
  const [selectedPriority, setSelectedPriority] = useState<string>("0")
  const [batchSize, setBatchSize] = useState<string>("100")
  const [continuousMode, setContinuousMode] = useState(false)
  const [cumulativeResults, setCumulativeResults] = useState<{
    totalProcessed: number
    totalSuccess: number
    totalFailed: number
    totalChanged: number
    totalUnchanged: number
    batches: number
  } | null>(null)

  const handleTestAi = async () => {
    setIsAiLoading(true)
    setAiResult(null)
    setCumulativeResults(null)

    const cumulative = {
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalChanged: 0,
      totalUnchanged: 0,
      batches: 0,
    }

    try {
      let shouldContinue = true

      while (shouldContinue) {
        const priorityParam = selectedPriority === "null" ? "" : `includePriority=${selectedPriority}`
        const batchSizeParam = `batchSize=${batchSize}`
        const params = [priorityParam, batchSizeParam].filter(Boolean).join("&")
        const url = `/api/scrape/ai-priority?${params}`

        const response = await fetch(url)
        const result = await response.json()

        // Update latest result
        setAiResult(result)

        // If no products found, stop
        if (result.count === 0 || !result.results) {
          shouldContinue = false
          break
        }

        // Accumulate results
        cumulative.totalProcessed += result.results.success + result.results.failed
        cumulative.totalSuccess += result.results.success || 0
        cumulative.totalFailed += result.results.failed || 0
        cumulative.totalChanged += result.results.changed?.count || 0
        cumulative.totalUnchanged += result.results.unchanged?.count || 0
        cumulative.batches++

        setCumulativeResults({ ...cumulative })

        // If not in continuous mode or got an error, stop
        if (!continuousMode || result.error) {
          shouldContinue = false
        }

        // Small delay between batches to avoid overwhelming the API
        if (shouldContinue) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
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
      <Card className="relative w-full">
        <CardHeader>
          <CardTitle>AI Priority Classifier</CardTitle>
          <CardDescription>Test the AI priority classification for products (Batch of 50)</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncTimerLoader isLoading={isAiLoading} className="absolute top-4 right-4" />

          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex w-full items-center gap-2">
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-[200px]" defaultValue="0">
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

                <Select value={batchSize} onValueChange={setBatchSize}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Batch size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 products</SelectItem>
                    <SelectItem value="100">100 products</SelectItem>
                    <SelectItem value="150">150 products</SelectItem>
                    <SelectItem value="200">200 products</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="continuous"
                    checked={continuousMode}
                    onCheckedChange={(checked) => setContinuousMode(checked === true)}
                  />
                  <Label htmlFor="continuous" className="cursor-pointer text-sm">
                    Continuous Mode
                  </Label>
                </div>
              </div>

              <Button onClick={handleTestAi} disabled={isAiLoading}>
                {isAiLoading ? "Processing..." : "Run AI Classification"}
              </Button>
            </div>

            {continuousMode && (
              <div className="bg-muted text-muted-foreground rounded-md border p-3 text-sm">
                <strong>Continuous Mode:</strong> Will process batches until no more products are found
              </div>
            )}
          </div>

          {cumulativeResults && cumulativeResults.batches > 1 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">Cumulative Results ({cumulativeResults.batches} batches)</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background">
                  Total: {cumulativeResults.totalProcessed}
                </Badge>
                <Badge variant="outline-success">Success: {cumulativeResults.totalSuccess}</Badge>
                <Badge variant="outline-destructive">Failed: {cumulativeResults.totalFailed}</Badge>
                <Badge variant="outline" className="bg-background">
                  Changed: {cumulativeResults.totalChanged}
                </Badge>
                <Badge variant="outline" className="bg-background">
                  Unchanged: {cumulativeResults.totalUnchanged}
                </Badge>
              </div>
            </div>
          )}
          {aiResult && (
            <div className="mt-4 space-y-3">
              {aiResult.results && (
                <div className="border-border bg-accent flex items-center gap-2 rounded border p-3 text-sm">
                  <Badge variant="outline-success">Success: {aiResult.results.success}</Badge>
                  <Badge variant="outline-destructive">Failed: {aiResult.results.failed}</Badge>
                  <Badge variant="outline" className="bg-background">
                    Changed: {aiResult.results.changed.count}
                  </Badge>
                  <Badge variant="outline" className="bg-background">
                    Unchanged: {aiResult.results.unchanged.count}
                  </Badge>
                </div>
              )}
              <pre className="bg-accent overflow-auto rounded border p-4 font-mono text-xs text-wrap">
                {JSON.stringify(aiResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
