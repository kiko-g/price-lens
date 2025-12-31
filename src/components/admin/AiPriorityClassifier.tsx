"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AsyncTimerLoader } from "@/components/ui/combo/async-timer-loader"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAiPriorityClassification } from "@/hooks/useAdmin"
import { Code } from "../ui/combo/code"

type CumulativeResults = {
  totalProcessed: number
  totalSuccess: number
  totalFailed: number
  totalChanged: number
  totalUnchanged: number
  batches: number
}

export function AiPriorityClassifier() {
  const [aiResult, setAiResult] = useState<any>(null)
  const [selectedPriority, setSelectedPriority] = useState<string>("0")
  const [batchSize, setBatchSize] = useState<string>("100")
  const [continuousMode, setContinuousMode] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [cumulativeResults, setCumulativeResults] = useState<CumulativeResults | null>(null)

  const classificationMutation = useAiPriorityClassification()

  const runSingleBatch = useCallback(async () => {
    const params = {
      includePriority: selectedPriority === "null" ? undefined : selectedPriority,
      batchSize: parseInt(batchSize),
    }

    return new Promise<any>((resolve, reject) => {
      classificationMutation.mutate(params, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error),
      })
    })
  }, [classificationMutation, selectedPriority, batchSize])

  const handleTestAi = async () => {
    setIsRunning(true)
    setAiResult(null)
    setCumulativeResults(null)

    const cumulative: CumulativeResults = {
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
        const result = await runSingleBatch()
        setAiResult(result)

        if (result.count === 0 || !result.results) {
          shouldContinue = false
          break
        }

        cumulative.totalProcessed += result.results.success + result.results.failed
        cumulative.totalSuccess += result.results.success || 0
        cumulative.totalFailed += result.results.failed || 0
        cumulative.totalChanged += result.results.changed?.count || 0
        cumulative.totalUnchanged += result.results.unchanged?.count || 0
        cumulative.batches++

        setCumulativeResults({ ...cumulative })

        if (!continuousMode || result.error) {
          shouldContinue = false
        }

        if (shouldContinue) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error("Error testing AI:", error)
      setAiResult({ error: "Failed to fetch" })
    } finally {
      setIsRunning(false)
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
          <AsyncTimerLoader isLoading={isRunning} className="absolute top-4 right-4" />

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

              <Button onClick={handleTestAi} disabled={isRunning}>
                {isRunning ? "Processing..." : "Run AI Classification"}
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
              <Code>{JSON.stringify(aiResult, null, 2)}</Code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
