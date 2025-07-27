"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  ChevronDownIcon,
  ChevronUpIcon,
  MoveRightIcon,
  MoveUpIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InflationData {
  year: number
  rate: number
  description: string
}

export function InflationTrends() {
  const [showMore, setShowMore] = useState(false)

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
    { year: 2021, rate: 4.7, description: "Chaos: Supply chain disruptions, reopening economy" },
    { year: 2022, rate: 8.0, description: "Overspending: 40-year high, broad-based inflation" },
    { year: 2023, rate: 4.1, description: "Damage was done: Cooling from peak but still elevated" },
    { year: 2024, rate: 3.2, description: "Land the plane: Continued moderation toward target" },
  ]

  const calculateStats = () => {
    const rates = inflationData.map((item) => item.rate)
    return {
      cumulative: rates.reduce((sum, rate) => sum + rate, 0),
      average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      highest: Math.max(...rates),
      lowest: Math.min(...rates),
      highestYear: inflationData.find((item) => item.rate === Math.max(...rates))?.year,
      lowestYear: inflationData.find((item) => item.rate === Math.min(...rates))?.year,
      average5:
        rates
          .reverse()
          .slice(0, 5)
          .reduce((sum, rate) => sum + rate, 0) / 5,
    }
  }

  const stats = calculateStats()
  const preFinancialCrisis = inflationData.filter((item) => item.year <= 2007)
  const postFinancialCrisis = inflationData.filter((item) => item.year >= 2008 && item.year <= 2019)
  const covidRecession = inflationData.filter((item) => item.year >= 2020 && item.year <= 2024)

  const getInflationBadge = (rate: number) => {
    if (rate > 3.0)
      return {
        variant: "destructive" as const,
        icon: <MoveUpIcon className="h-3 w-3" />,
        className: "text-destructive",
      }
    if (rate >= 2.0)
      return {
        variant: "boring" as const,
        icon: <TrendingUpIcon className="h-3 w-3" />,
        className: "text-muted-foreground",
      }
    if (rate >= 0.0)
      return { variant: "success" as const, icon: <MoveRightIcon className="h-3 w-3" />, className: "text-success" }
    return {
      variant: "default" as const,
      icon: <TrendingDownIcon className="h-3 w-3" />,
      className: "text-foreground",
    }
  }

  return (
    <>
      <section className="border-border w-full border-t px-4 py-12 md:py-16 lg:py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 md:px-16">
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Inflation trends since 1999
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
              Historical Consumer Price Index (CPI-U) inflation rates from the Bureau of Labor Statistics. Data
              represents year-over-year percentage change spanning 25+ years of economic cycles.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">25-Year Average</div>
                <div className={cn("text-2xl font-bold", getInflationBadge(stats.average).className)}>
                  {stats.average.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">5-Year Average</div>
                <div className={cn("text-2xl font-bold", getInflationBadge(stats.average5).className)}>
                  {stats.average5.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">Highest rate</div>
                <div className="text-destructive text-2xl font-bold">{stats.highest.toFixed(1)}%</div>
                <div className="text-muted-foreground text-xs">Achieved in {stats.highestYear}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">Fed Target</div>
                <div className="text-primary text-2xl font-bold">2.0%</div>
                <div className="text-muted-foreground text-xs">
                  Long-term goal only {inflationData.filter((item) => item.rate <= 2.0).length} out of{" "}
                  {inflationData.length} years
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historical Data</CardTitle>
              <CardDescription>
                Data represents a cumulative inflation rate of{" "}
                <strong className="text-destructive">{stats.cumulative.toFixed(2)}%</strong> since 1999. In other words,
                having 100.00$ in 1999, is having{" "}
                <strong className="text-foreground">{(100 * (1 + stats.cumulative / 100)).toFixed(2)}$</strong> today.
              </CardDescription>
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
                  {[...inflationData]
                    .reverse()
                    .slice(0, showMore ? undefined : 10)
                    .map((item) => {
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

              <div className="flex justify-center border-t pt-6">
                <Button variant="outline" className="w-full lg:w-1/4" onClick={() => setShowMore(!showMore)} size="sm">
                  {showMore ? "Show Less" : "Show More"}
                  {showMore ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-secondary/5 border-secondary/30 w-full border-y px-4 py-12 md:py-16 lg:py-24"></section>

      <section className="border-border w-full px-4 py-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-3">
          <h2 className="max-w-5xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Economic Period Comparisons
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
            Relevant intervals and events that have affected the US economy and therefore the world.
          </p>
        </div>

        {/* Period Comparisons */}
        <div className="mx-auto mt-5 flex w-full max-w-6xl flex-col gap-6 px-5 md:px-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pre-Financial Crisis (1999-2007)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <span className="text-sm">
                      {(
                        preFinancialCrisis.reduce((sum, item) => sum + item.rate, 0) / preFinancialCrisis.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Range</span>
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
                  <CardTitle className="text-lg">Post-Financial Crisis (2008-2019)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <span className="text-sm">
                      {(
                        postFinancialCrisis.reduce((sum, item) => sum + item.rate, 0) / postFinancialCrisis.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Range</span>
                    <span className="text-sm">
                      {Math.min(...postFinancialCrisis.map((item) => item.rate)).toFixed(1)}% to{" "}
                      {Math.max(...postFinancialCrisis.map((item) => item.rate)).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">Higher volatility with extreme lows and recent highs</p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-lg">COVID-19 Recession (2020-2024)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <span className="text-sm">
                      {(covidRecession.reduce((sum, item) => sum + item.rate, 0) / covidRecession.length).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Range</span>
                    <span className="text-sm">
                      {Math.min(...covidRecession.map((item) => item.rate)).toFixed(1)}% to{" "}
                      {Math.max(...covidRecession.map((item) => item.rate)).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">GDP fell ~3.5% as lockdowns shut down activity</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Economic Events */}
            <Card className="bg-primary/10 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Notable Economic Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col">
                  <div className="font-medium">2001: Dot-com Bubble Burst & Recession</div>
                  <div className="text-muted-foreground text-sm">
                    Tech stock collapse and 9/11 attacks led to a brief recession and economic uncertainty.
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">2008: US housing market causes world-wide recession</div>
                  <div className="text-muted-foreground text-sm">
                    Default through the roof, evil loans and a global collapse as a result.
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">2014-2015: Near Zero Inflation</div>
                  <div className="text-muted-foreground text-sm">Oil price collapse &amp; global disinflation</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">2020: COVID-19 Recession</div>
                  <div className="text-muted-foreground text-sm">GDP fell ~3.5% as lockdowns shut down activity</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">2021: Fiscal Stimulus Surge</div>
                  <div className="text-muted-foreground text-sm">
                    $1.9T American Rescue Plan &amp; follow-on bills drove a spending wave
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">2022: 40-Year High Inflation</div>
                  <div className="text-muted-foreground text-sm">
                    8.0% due to supply-chain strains &amp; energy price shocks
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
