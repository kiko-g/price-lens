"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  ChevronDownIcon,
  ChevronUpIcon,
  MoveRightIcon,
  MoveUpIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WheatIcon,
  ShipIcon,
  BuildingIcon,
  FuelIcon,
} from "lucide-react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface InflationData {
  year: number
  rateUSA: number
  ratePT: number
  rateEU: number
  description: string
}

export function InflationTrends() {
  const [showMore, setShowMore] = useState(false)

  const chartConfig = {
    rateUSA: {
      label: "United States",
      color: "var(--chart-1)",
    },
    ratePT: {
      label: "Portugal",
      color: "var(--chart-2)",
    },
    rateEU: {
      label: "Eurozone",
      color: "var(--chart-4)",
    },
  }

  const inflationData: InflationData[] = [
    { year: 1999, rateUSA: 2.2, ratePT: 2.2, rateEU: 1.1, description: "Dot-com boom period, Euro launch year" },
    { year: 2000, rateUSA: 3.4, ratePT: 2.8, rateEU: 2.2, description: "Energy price increases, early Euro adoption" },
    { year: 2001, rateUSA: 2.8, ratePT: 4.4, rateEU: 2.3, description: "Post dot-com crash, EU expansion effects" },
    { year: 2002, rateUSA: 1.6, ratePT: 3.7, rateEU: 2.3, description: "Economic slowdown, Euro cash introduction" },
    { year: 2003, rateUSA: 2.3, ratePT: 3.3, rateEU: 2.1, description: "Recovery begins, Iraq war oil impact" },
    { year: 2004, rateUSA: 2.7, ratePT: 2.5, rateEU: 2.1, description: "Steady growth across regions" },
    { year: 2005, rateUSA: 3.4, ratePT: 2.1, rateEU: 2.2, description: "Energy and housing costs rise globally" },
    { year: 2006, rateUSA: 3.2, ratePT: 3.0, rateEU: 2.2, description: "Peak housing market, commodity boom" },
    { year: 2007, rateUSA: 2.8, ratePT: 2.4, rateEU: 2.1, description: "Financial crisis begins, pre-recession" },
    { year: 2008, rateUSA: 3.8, ratePT: 2.7, rateEU: 3.3, description: "Great Recession, global commodity spikes" },
    { year: 2009, rateUSA: -0.4, ratePT: -0.9, rateEU: 0.3, description: "Deflation during recession depths" },
    { year: 2010, rateUSA: 1.6, ratePT: 1.4, rateEU: 1.6, description: "Early recovery, sovereign debt crisis begins" },
    { year: 2011, rateUSA: 3.1, ratePT: 3.6, rateEU: 2.7, description: "European debt crisis, commodity volatility" },
    { year: 2012, rateUSA: 2.1, ratePT: 2.8, rateEU: 2.5, description: "QE era, European austerity measures" },
    { year: 2013, rateUSA: 1.5, ratePT: 0.4, rateEU: 1.4, description: "Below targets despite monetary easing" },
    { year: 2014, rateUSA: 0.1, ratePT: -0.2, rateEU: 0.4, description: "Oil price collapse, European stagnation" },
    { year: 2015, rateUSA: 0.1, ratePT: 0.5, rateEU: 0.0, description: "Near-zero inflation period globally" },
    { year: 2016, rateUSA: 1.3, ratePT: 0.6, rateEU: 0.3, description: "Gradual recovery, Brexit uncertainty" },
    { year: 2017, rateUSA: 2.1, ratePT: 1.6, rateEU: 1.5, description: "Recovery strengthens across regions" },
    { year: 2018, rateUSA: 2.4, ratePT: 1.2, rateEU: 1.8, description: "Above targets, trade war tensions" },
    { year: 2019, rateUSA: 1.8, ratePT: 0.3, rateEU: 1.2, description: "Below targets despite low unemployment" },
    { year: 2020, rateUSA: 1.2, ratePT: -0.1, rateEU: 0.3, description: "COVID-19 pandemic deflationary impact" },
    { year: 2021, rateUSA: 4.7, ratePT: 1.3, rateEU: 2.6, description: "Chaos: Supply chains, reopening economies" },
    { year: 2022, rateUSA: 8.0, ratePT: 7.8, rateEU: 8.4, description: "Overspending: Energy crisis, Ukraine war" },
    { year: 2023, rateUSA: 4.1, ratePT: 5.3, rateEU: 5.4, description: "Damage was done: Cooling but elevated" },
    { year: 2024, rateUSA: 3.2, ratePT: 2.3, rateEU: 2.4, description: "Land the plane: Moderating toward targets" },
  ]

  const impactFactors = [
    {
      title: "Energy Dependency",
      icon: <FuelIcon className="h-5 w-5" />,
      impact: "Critical",
      description:
        "Portugal imports 75% of its energy needs. When global oil and gas prices spike (driven by US dollar strength, geopolitical tensions, or Fed policy), Portuguese energy costs surge immediately.",
      examples: [
        "2022: Russian gas crisis → 40% energy price increase",
        "2008: Oil speculation → Transport cost inflation",
        "2000s: Iraq War → Sustained energy price pressure",
      ],
    },
    {
      title: "Dollar-Denominated Commodities",
      icon: <WheatIcon className="h-5 w-5" />,
      impact: "High",
      description:
        "Essential goods like wheat, corn, soybeans, and metals are priced in USD globally. When the Fed prints money or cuts rates, commodity prices inflate, directly hitting Portuguese food costs.",
      examples: [
        "2021-2022: Fed money printing → Global food inflation",
        "2011: QE2 → Commodity speculation boom",
        "2008: Dollar weakness → Food crisis in Portugal",
      ],
    },
    {
      title: "Supply Chain Integration",
      icon: <ShipIcon className="h-5 w-5" />,
      impact: "High",
      description:
        "Portuguese retailers depend on global supply chains. US labor costs, shipping rates from Asia, and manufacturing disruptions flow through to Portuguese supermarket prices with 3-6 month delays.",
      examples: [
        "2021: US port congestion → Portuguese import delays",
        "2022: Chinese lockdowns → Product shortages in PT",
        "2018: US-China trade war → Higher electronics prices",
      ],
    },
    {
      title: "ECB Policy Following Fed",
      icon: <BuildingIcon className="h-5 w-5" />,
      impact: "Structural",
      description:
        "The European Central Bank typically follows Federal Reserve policy with a 6-12 month lag. US rate hikes eventually force ECB tightening, affecting Portuguese credit, housing, and business costs.",
      examples: [
        "2022-2023: Fed hikes → ECB forced to follow → PT mortgage rates up",
        "2008-2015: Fed QE → ECB QE → Asset price inflation in PT",
        "1999-2007: Fed easy money → ECB accommodation → PT housing bubble",
      ],
    },
  ]

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "Critical":
        return "destructive"
      case "High":
        return "primary"
      case "Structural":
        return "outline"
      default:
        return "default"
    }
  }

  const calculateStats = () => {
    const ratesUSA = inflationData.map((item) => item.rateUSA)
    const ratesPT = inflationData.map((item) => item.ratePT)
    const ratesEU = inflationData.map((item) => item.rateEU)

    return {
      usa: {
        cumulative: ratesUSA.reduce((sum, rate) => sum + rate, 0),
        average: ratesUSA.reduce((sum, rate) => sum + rate, 0) / ratesUSA.length,
        highest: Math.max(...ratesUSA),
        lowest: Math.min(...ratesUSA),
        highestYear: inflationData.find((item) => item.rateUSA === Math.max(...ratesUSA))?.year,
        lowestYear: inflationData.find((item) => item.rateUSA === Math.min(...ratesUSA))?.year,
        average5:
          ratesUSA
            .reverse()
            .slice(0, 5)
            .reduce((sum, rate) => sum + rate, 0) / 5,
      },
      pt: {
        cumulative: ratesPT.reduce((sum, rate) => sum + rate, 0),
        average: ratesPT.reduce((sum, rate) => sum + rate, 0) / ratesPT.length,
        highest: Math.max(...ratesPT),
        lowest: Math.min(...ratesPT),
        highestYear: inflationData.find((item) => item.ratePT === Math.max(...ratesPT))?.year,
        lowestYear: inflationData.find((item) => item.ratePT === Math.min(...ratesPT))?.year,
        average5:
          ratesPT
            .reverse()
            .slice(0, 5)
            .reduce((sum, rate) => sum + rate, 0) / 5,
      },
      eu: {
        cumulative: ratesEU.reduce((sum, rate) => sum + rate, 0),
        average: ratesEU.reduce((sum, rate) => sum + rate, 0) / ratesEU.length,
        highest: Math.max(...ratesEU),
        lowest: Math.min(...ratesEU),
        highestYear: inflationData.find((item) => item.rateEU === Math.max(...ratesEU))?.year,
        lowestYear: inflationData.find((item) => item.rateEU === Math.min(...ratesEU))?.year,
        average5:
          ratesEU
            .reverse()
            .slice(0, 5)
            .reduce((sum, rate) => sum + rate, 0) / 5,
      },
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
      <section className="border-border w-full px-4 py-12 md:py-16 lg:py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 md:px-16">
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Inflation trends since 1999
            </h2>
            <p className="text-muted-foreground mx-auto max-w-4xl text-center text-sm md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
              Historical Consumer Price Index (CPI-U) inflation rates from the US Bureau of Labor Statistics, Portugal
              and Eurozone. Data represents year-over-year percentage change spanning 25+ years of economic cycles.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">25-Year Average</div>
                <div className={cn("flex flex-col text-2xl font-bold", getInflationBadge(stats.usa.average).className)}>
                  <span className="hidden md:block">🇺🇸 {stats.usa.average.toFixed(1)}%</span>
                  <span>🇵🇹 {stats.pt.average.toFixed(1)}%</span>
                  <span className="hidden md:block">🇪🇺 {stats.eu.average.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">5-Year Average</div>
                <div
                  className={cn("flex flex-col text-2xl font-bold", getInflationBadge(stats.usa.average5).className)}
                >
                  <span className="hidden md:block">🇺🇸 {stats.usa.average5.toFixed(1)}%</span>
                  <span>🇵🇹 {stats.pt.average5.toFixed(1)}%</span>
                  <span className="hidden md:block">🇪🇺 {stats.eu.average5.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">Highest rate</div>
                <div className="flex flex-col text-2xl font-bold">
                  <span className="hidden md:block">🇺🇸 {stats.usa.highest.toFixed(1)}%</span>
                  <span>🇵🇹 {stats.pt.highest.toFixed(1)}%</span>
                  <span className="hidden md:block">🇪🇺 {stats.eu.highest.toFixed(1)}%</span>
                </div>
                <div className="text-muted-foreground text-xs">Achieved in {stats.usa.highestYear}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">Fed Target</div>
                <div className="text-primary text-2xl font-bold">2.0%</div>
                <div className="text-muted-foreground text-xs">
                  Long-term goal only {inflationData.filter((item) => item.rateUSA <= 2.0).length} out of{" "}
                  {inflationData.length} years
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historical Inflation Data</CardTitle>
              <CardDescription>
                <p>
                  Data represents a cumulative inflation rate of{" "}
                  <strong className="text-destructive">{stats.usa.cumulative.toFixed(2)}%</strong>,{" "}
                  <strong className="text-destructive">{stats.pt.cumulative.toFixed(2)}%</strong> and{" "}
                  <strong className="text-destructive">{stats.eu.cumulative.toFixed(2)}%</strong> for the USA, Portugal
                  and Eurozone since 1999, respectively.
                </p>

                <p className="mt-0 hidden md:block">
                  In other words, having <strong className="text-foreground">100.00$</strong> in 1999, is having{" "}
                  <strong className="text-foreground">{(100 * (1 + stats.usa.cumulative / 100)).toFixed(2)}$</strong>{" "}
                  today.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>🇵🇹 PT</TableHead>
                    <TableHead>🇺🇸 USA</TableHead>
                    <TableHead>🇪🇺 EURO</TableHead>
                    <TableHead>Economic Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...inflationData]
                    .reverse()
                    .slice(0, showMore ? undefined : 8)
                    .map((item) => {
                      const badgeProps = getInflationBadge(item.rateUSA)
                      return (
                        <TableRow key={item.year}>
                          <TableCell className="font-medium">{item.year}</TableCell>
                          <TableCell>
                            <Badge
                              variant={badgeProps.variant}
                              className="gap-1 [&_svg]:hidden md:[&_svg]:inline-flex"
                              size="xs"
                            >
                              {badgeProps.icon}
                              {item.ratePT >= 0 ? "+" : ""}
                              {item.ratePT.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={badgeProps.variant}
                              className="gap-1 [&_svg]:hidden md:[&_svg]:inline-flex"
                              size="xs"
                            >
                              {badgeProps.icon}
                              {item.rateUSA >= 0 ? "+" : ""}
                              {item.rateUSA.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={badgeProps.variant}
                              className="gap-1 [&_svg]:hidden md:[&_svg]:inline-flex"
                              size="xs"
                            >
                              {badgeProps.icon}
                              {item.rateEU >= 0 ? "+" : ""}
                              {item.rateEU.toFixed(1)}%
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

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUpIcon className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                Inflation Convergence
              </CardTitle>
              <CardDescription className="text-sm">
                How US monetary policy and global events drive inflation synchronization across regions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <ChartContainer config={chartConfig} className="h-[250px] w-full sm:h-[300px] lg:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inflationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 400 }}
                      dataKey="year"
                      interval="preserveStartEnd"
                      tickMargin={8}
                      className="text-xs sm:text-sm"
                      domain={[1999, 2024]}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 400 }}
                      tickMargin={8}
                      width={35}
                      domain={[0, 8]}
                      label={{
                        value: "Rate (%)",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle", fontSize: "12px" },
                      }}
                      className="text-xs sm:text-sm"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "12px",
                      }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="rateUSA"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      name="United States"
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ratePT"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      name="Portugal"
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rateEU"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      name="Eurozone"
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-secondary/5 border-secondary/30 hidden w-full border-y px-4 py-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-3">
          <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Impact on Portugal 🇵🇹
          </h2>
          <p className="text-muted-foreground mx-auto max-w-4xl text-center text-sm md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
            Global events have a significant impact on Portugal's inflation rate. Price Lens tries to raise awareness
            and protect consumers from the impact of these events.
          </p>
        </div>

        <div className="mx-auto mt-5 flex w-full max-w-5xl flex-col gap-6 px-5 md:px-16">
          {/* Factors */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {impactFactors.map((factor, index) => (
              <Card key={index} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base leading-tight sm:text-lg">
                      <span className="flex-shrink-0">{factor.icon}</span>
                      <span className="break-words">{factor.title}</span>
                    </CardTitle>
                    <Badge variant={getImpactColor(factor.impact) as any} className="flex-shrink-0 text-xs">
                      {factor.impact}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">{factor.description}</p>
                  <div className="space-y-1 md:space-y-2">
                    <div className="text-xs font-medium sm:text-sm">Historical Examples:</div>
                    <ul className="space-y-1">
                      {factor.examples.map((example, i) => (
                        <li key={i} className="text-muted-foreground flex items-start gap-2 text-xs">
                          <span className="text-primary mt-1 flex-shrink-0">•</span>
                          <span className="leading-relaxed">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border w-full border-t px-4 py-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-3">
          <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Economic Period Comparisons
          </h2>
          <p className="text-muted-foreground mx-auto max-w-4xl text-center md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
            Relevant intervals and events that have affected the US economy and therefore the world.
          </p>
        </div>

        {/* Period Comparisons */}
        <div className="mx-auto mt-5 flex w-full max-w-6xl flex-col gap-6 px-0 md:px-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pre-Financial Crisis (1999-2007)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 md:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <span className="text-sm">
                      {(
                        preFinancialCrisis.reduce((sum, item) => sum + item.rateUSA, 0) / preFinancialCrisis.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Range</span>
                    <span className="text-sm">
                      {Math.min(...preFinancialCrisis.map((item) => item.rateUSA)).toFixed(1)}% to{" "}
                      {Math.max(...preFinancialCrisis.map((item) => item.rateUSA)).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">Relatively stable period with moderate inflation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Post-Financial Crisis (2008-2019)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 md:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <span className="text-sm">
                      {(
                        postFinancialCrisis.reduce((sum, item) => sum + item.rateUSA, 0) / postFinancialCrisis.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Range</span>
                    <span className="text-sm">
                      {Math.min(...postFinancialCrisis.map((item) => item.rateUSA)).toFixed(1)}% to{" "}
                      {Math.max(...postFinancialCrisis.map((item) => item.rateUSA)).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">Higher volatility with extreme lows and recent highs</p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-lg">COVID-19 Recession (2020-2024)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 md:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <span className="text-sm">
                      {(covidRecession.reduce((sum, item) => sum + item.rateUSA, 0) / covidRecession.length).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Range</span>
                    <span className="text-sm">
                      {Math.min(...covidRecession.map((item) => item.rateUSA)).toFixed(1)}% to{" "}
                      {Math.max(...covidRecession.map((item) => item.rateUSA)).toFixed(1)}%
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
