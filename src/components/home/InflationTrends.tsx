"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, TrendingDownIcon, MoveRightIcon, MoveUpIcon, TrendingUpIcon } from "lucide-react"

interface InflationData {
  year: number
  rate: number
  description: string
}

export function InflationTrends() {
  const inflationData: InflationData[] = [
    { year: 1999, rate: 2.2, description: "Dot-com boom period" },
    { year: 2000, rate: 3.4, description: "Energy price increases" },
    { year: 2001, rate: 2.8, description: "Post dot-com crash recession begins" },
    { year: 2002, rate: 1.6, description: "Economic slowdown" },
    { year: 2003, rate: 2.3, description: "Recovery begins" },
    { year: 2004, rate: 2.7, description: "Steady economic growth" },
    { year: 2005, rate: 3.4, description: "Energy and housing costs rise" },
    { year: 2006, rate: 3.2, description: "Peak housing market" },
    { year: 2007, rate: 2.8, description: "Financial crisis begins" },
    { year: 2008, rate: 3.8, description: "Great Recession, commodity price spikes" },
    { year: 2009, rate: -0.4, description: "Deflation during recession depths" },
    { year: 2010, rate: 1.6, description: "Early recovery from recession" },
    { year: 2011, rate: 3.1, description: "Food and energy price volatility" },
    { year: 2012, rate: 2.1, description: "QE era, approaching Fed target" },
    { year: 2013, rate: 1.5, description: "Below Fed target despite QE" },
    { year: 2014, rate: 0.1, description: "Oil price collapse" },
    { year: 2015, rate: 0.1, description: "Near-zero inflation period" },
    { year: 2016, rate: 1.3, description: "Gradual recovery" },
    { year: 2017, rate: 2.1, description: "Approaching Fed target" },
    { year: 2018, rate: 2.4, description: "Above Fed target, tight labor market" },
    { year: 2019, rate: 1.8, description: "Below Fed target despite low unemployment" },
    { year: 2020, rate: 1.2, description: "COVID-19 pandemic deflationary impact" },
    { year: 2021, rate: 4.7, description: "Supply chain disruptions, reopening economy" },
    { year: 2022, rate: 8.0, description: "40-year high, broad-based inflation" },
    { year: 2023, rate: 4.1, description: "Cooling from peak but still elevated" },
    { year: 2024, rate: 3.2, description: "Continued moderation toward target" },
  ]

  const calculateStats = () => {
    const rates = inflationData.map((item) => item.rate)
    return {
      average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      highest: Math.max(...rates),
      lowest: Math.min(...rates),
      highestYear: inflationData.find((item) => item.rate === Math.max(...rates))?.year,
      lowestYear: inflationData.find((item) => item.rate === Math.min(...rates))?.year,
    }
  }

  const stats = calculateStats()
  const preFinancialCrisis = inflationData.filter((item) => item.year <= 2007)
  const postFinancialCrisis = inflationData.filter((item) => item.year >= 2008)

  const getInflationBadge = (rate: number) => {
    if (rate > 3.0) return { variant: "destructive" as const, icon: <MoveUpIcon className="h-3 w-3" /> }
    if (rate >= 2.0) return { variant: "boring" as const, icon: <TrendingUpIcon className="h-3 w-3" /> }
    if (rate >= 0.0) return { variant: "success" as const, icon: <MoveRightIcon className="h-3 w-3" /> }
    return { variant: "default" as const, icon: <TrendingDownIcon className="h-3 w-3" /> }
  }

  return (
    <section className="border-border w-full border-t px-4 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 md:px-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">US CPI Inflation Rates (1999-2024)</CardTitle>
            <CardDescription>
              Historical Consumer Price Index (CPI-U) inflation rates from the Bureau of Labor Statistics. Data
              represents year-over-year percentage change spanning 25+ years of economic cycles.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm font-medium">25-Year Average</div>
              <div className="text-2xl font-bold">{stats.average.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm font-medium">Highest Ever</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.highest.toFixed(1)}%
                <span className="text-muted-foreground ml-1 text-sm font-normal">({stats.highestYear})</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm font-medium">Lowest Ever</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.lowest.toFixed(1)}%
                <span className="text-muted-foreground ml-1 text-sm font-normal">({stats.lowestYear})</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm font-medium">Fed Target</div>
              <div className="text-2xl font-bold">2.0%</div>
              <div className="text-muted-foreground text-xs">Long-term goal</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historical Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Inflation Rate</TableHead>
                  <TableHead>Economic Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...inflationData].reverse().map((item) => {
                  const badgeProps = getInflationBadge(item.rate)
                  return (
                    <TableRow key={item.year}>
                      <TableCell className="font-medium">{item.year}</TableCell>
                      <TableCell>
                        <Badge variant={badgeProps.variant} className="gap-1" size="sm">
                          {badgeProps.icon}
                          {item.rate > 0 ? "+" : ""}
                          {item.rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.description}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Period Comparisons */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pre-Financial Crisis (1999-2007)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Average:</span>
                <span className="text-sm">
                  {(preFinancialCrisis.reduce((sum, item) => sum + item.rate, 0) / preFinancialCrisis.length).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Range:</span>
                <span className="text-sm">
                  {Math.min(...preFinancialCrisis.map((item) => item.rate)).toFixed(1)}% to{" "}
                  {Math.max(...preFinancialCrisis.map((item) => item.rate)).toFixed(1)}%
                </span>
              </div>
              <p className="text-muted-foreground text-xs">Relatively stable period with moderate inflation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post-Financial Crisis (2008-2024)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Average:</span>
                <span className="text-sm">
                  {(postFinancialCrisis.reduce((sum, item) => sum + item.rate, 0) / postFinancialCrisis.length).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Range:</span>
                <span className="text-sm">
                  {Math.min(...postFinancialCrisis.map((item) => item.rate)).toFixed(1)}% to{" "}
                  {Math.max(...postFinancialCrisis.map((item) => item.rate)).toFixed(1)}%
                </span>
              </div>
              <p className="text-muted-foreground text-xs">Higher volatility with extreme lows and recent highs</p>
            </CardContent>
          </Card>
        </div>

        {/* Key Economic Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notable Economic Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="font-medium">2009: Only Deflationary Year</div>
                <div className="text-muted-foreground text-sm">-0.4% during Great Recession depths</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">2022: 40-Year High</div>
                <div className="text-muted-foreground text-sm">8.0% due to supply chains & energy</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">2014-2015: Near Zero</div>
                <div className="text-muted-foreground text-sm">Oil price collapse & global disinflation</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Fed Target: 2%</div>
                <div className="text-muted-foreground text-sm">Achieved in only 7 out of 25 years</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Data Collapsible */}
        <Collapsible>
          <CollapsibleTrigger className="hover:text-primary flex items-center gap-2 text-sm font-medium">
            <ChevronDown className="h-4 w-4" />
            Raw Data Array (Copy for Charts/Analysis)
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-4">
                <pre className="bg-muted overflow-x-auto rounded p-4 text-xs">
                  {JSON.stringify(inflationData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">
              Source: U.S. Bureau of Labor Statistics (BLS) - Consumer Price Index for All Urban Consumers (CPI-U).
              Federal Reserve target inflation rate is approximately 2%. Data covers major economic cycles from dot-com
              boom to post-pandemic recovery.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
