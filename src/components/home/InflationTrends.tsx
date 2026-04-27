"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  BULLET,
  EM_DASH,
  formatPercentFixed,
  formatPercentRange,
  formatPercentSigned,
} from "@/lib/i18n/formatting-glyphs"

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
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"

interface InflationData {
  year: number
  rateUSA: number
  ratePT: number
  rateEU: number
  description: string
}

export function InflationTrends() {
  const [showMore, setShowMore] = useState(false)
  const t = useTranslations("home.inflationTrends")
  const tCtx = useTranslations("home.inflationContext.regions")

  const chartConfig = {
    rateUSA: {
      label: tCtx("usa"),
      color: "var(--chart-1)",
    },
    ratePT: {
      label: tCtx("pt"),
      color: "var(--chart-2)",
    },
    rateEU: {
      label: tCtx("eu"),
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

  const cumulativeInflation = inflationData.reduce(
    (acc, item) => {
      const last = acc[acc.length - 1]
      const next = {
        year: item.year,
        usa: last.usa * (1 + item.rateUSA / 100),
        pt: last.pt * (1 + item.ratePT / 100),
        eu: last.eu * (1 + item.rateEU / 100),
      }
      acc.push(next)
      return acc
    },
    [{ year: 1999, usa: 100, pt: 100, eu: 100 }],
  )

  type ImpactKind = "destructive" | "primary" | "outline" | "default"

  const impactFactorDefs = useMemo(
    () =>
      [
        { id: "energy" as const, icon: <FuelIcon className="h-5 w-5" />, impactLevel: "critical" as const },
        { id: "commodities" as const, icon: <WheatIcon className="h-5 w-5" />, impactLevel: "high" as const },
        { id: "supplyChain" as const, icon: <ShipIcon className="h-5 w-5" />, impactLevel: "high" as const },
        { id: "ecb" as const, icon: <BuildingIcon className="h-5 w-5" />, impactLevel: "structural" as const },
      ] as const,
    [],
  )

  const getImpactColor = (impact: "critical" | "high" | "structural"): ImpactKind => {
    switch (impact) {
      case "critical":
        return "destructive"
      case "high":
        return "primary"
      case "structural":
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
      <section className="bg-primary/5 w-full px-4 py-12 md:py-16 lg:py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 md:px-16">
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-4xl text-center text-sm md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">{t("stats.average25")}</div>
                <div className={cn("flex flex-col text-2xl font-bold", getInflationBadge(stats.usa.average).className)}>
                  <span className="hidden md:block">
                    {t("stats.flagLineUSA", { pct: formatPercentFixed(stats.usa.average) })}
                  </span>
                  <span>{t("stats.flagLinePT", { pct: formatPercentFixed(stats.pt.average) })}</span>
                  <span className="hidden md:block">
                    {t("stats.flagLineEU", { pct: formatPercentFixed(stats.eu.average) })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">{t("stats.average5")}</div>
                <div
                  className={cn("flex flex-col text-2xl font-bold", getInflationBadge(stats.usa.average5).className)}
                >
                  <span className="hidden md:block">
                    {t("stats.flagLineUSA", { pct: formatPercentFixed(stats.usa.average5) })}
                  </span>
                  <span>{t("stats.flagLinePT", { pct: formatPercentFixed(stats.pt.average5) })}</span>
                  <span className="hidden md:block">
                    {t("stats.flagLineEU", { pct: formatPercentFixed(stats.eu.average5) })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">{t("stats.highest")}</div>
                <div className="flex flex-col text-2xl font-bold">
                  <span className="hidden md:block">
                    {t("stats.flagLineUSA", { pct: formatPercentFixed(stats.usa.highest) })}
                  </span>
                  <span>{t("stats.flagLinePT", { pct: formatPercentFixed(stats.pt.highest) })}</span>
                  <span className="hidden md:block">
                    {t("stats.flagLineEU", { pct: formatPercentFixed(stats.eu.highest) })}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {t("stats.highestYear", { year: stats.usa.highestYear ?? EM_DASH })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-muted-foreground text-sm font-medium">{t("stats.fedTarget")}</div>
                <div className="text-primary text-2xl font-bold">{formatPercentFixed(2.0, 1)}</div>
                <div className="text-muted-foreground text-xs">
                  {t("stats.fedTargetNote", {
                    met: inflationData.filter((item) => item.rateUSA <= 2.0).length,
                    total: inflationData.length,
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("table.title")}</CardTitle>
              <CardDescription>
                <p>
                  {t.rich("table.summary", {
                    usa: stats.usa.cumulative.toFixed(2),
                    pt: stats.pt.cumulative.toFixed(2),
                    eu: stats.eu.cumulative.toFixed(2),
                    strong: (chunks) => <strong className="text-destructive">{chunks}</strong>,
                  })}
                </p>

                <p className="mt-0 hidden md:block">
                  {t.rich("table.summary2", {
                    value: (100 * (1 + stats.usa.cumulative / 100)).toFixed(2),
                    strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                  })}
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.year")}</TableHead>
                    <TableHead>{t("table.colPT")}</TableHead>
                    <TableHead>{t("table.colUSA")}</TableHead>
                    <TableHead>{t("table.colEURO")}</TableHead>
                    <TableHead>{t("table.context")}</TableHead>
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
                              {formatPercentSigned(item.ratePT)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={badgeProps.variant}
                              className="gap-1 [&_svg]:hidden md:[&_svg]:inline-flex"
                              size="xs"
                            >
                              {badgeProps.icon}
                              {formatPercentSigned(item.rateUSA)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={badgeProps.variant}
                              className="gap-1 [&_svg]:hidden md:[&_svg]:inline-flex"
                              size="xs"
                            >
                              {badgeProps.icon}
                              {formatPercentSigned(item.rateEU)}
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
                  {showMore ? t("table.showLess") : t("table.showMore")}
                  {showMore ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 md:flex-row">
            {/* Inflation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUpIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  {t("convergence.title")}
                </CardTitle>
                <CardDescription className="text-sm">{t("convergence.description")}</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ChartContainer config={chartConfig} className="h-[250px] w-full sm:h-[300px] lg:h-[250px]">
                  <LineChart data={inflationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis
                      dataKey="year"
                      interval="preserveStartEnd"
                      tickMargin={8}
                      minTickGap={16}
                      domain={[1999, 2024]}
                    />
                    <YAxis
                      tickMargin={8}
                      width={35}
                      domain={[0, 8]}
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                      label={{
                        value: t("convergence.yLabel"),
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle", fontSize: "12px" },
                      }}
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
                      name={tCtx("usa")}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ratePT"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      name={tCtx("pt")}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rateEU"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      name={tCtx("eu")}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Cumulative Inflation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUpIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  {t("cumulative.title")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t.rich("cumulative.descriptionRich", {
                    strong: (chunks) => <strong className="text-destructive">{chunks}</strong>,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ChartContainer config={chartConfig} className="h-[250px] w-full sm:h-[300px] lg:h-[250px]">
                  <LineChart data={cumulativeInflation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis
                      dataKey="year"
                      interval="preserveStartEnd"
                      tickMargin={8}
                      minTickGap={16}
                      domain={[1999, 2024]}
                    />
                    <YAxis
                      tickMargin={8}
                      width={35}
                      domain={[100, 200]}
                      label={{
                        value: t("cumulative.yAxisLabel"),
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle", fontSize: "12px" },
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="usa"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      name={tCtx("usa")}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pt"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      name={tCtx("pt")}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eu"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      name={tCtx("eu")}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary/5 border-secondary/30 hidden w-full border-b px-4 py-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-3">
          <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {t("impactPortugal.title")}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-4xl text-center text-sm md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
            {t("impactPortugal.subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-5 flex w-full max-w-5xl flex-col gap-6 px-5 md:px-16">
          {/* Factors */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {impactFactorDefs.map((factor) => (
              <Card key={factor.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base leading-tight sm:text-lg">
                      <span className="shrink-0">{factor.icon}</span>
                      <span className="wrap-break-word">{t(`impactFactors.${factor.id}.title`)}</span>
                    </CardTitle>
                    <Badge variant={getImpactColor(factor.impactLevel) as ImpactKind} className="shrink-0 text-xs">
                      {t(`impactFactors.levels.${factor.impactLevel}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                    {t(`impactFactors.${factor.id}.description`)}
                  </p>
                  <div className="space-y-1 md:space-y-2">
                    <div className="text-xs font-medium sm:text-sm">{t("impactFactors.historicalExamples")}</div>
                    <ul className="space-y-1">
                      {(["ex0", "ex1", "ex2"] as const).map((ex) => (
                        <li key={ex} className="text-muted-foreground flex items-start gap-2 text-xs">
                          <span className="text-primary mt-1 shrink-0">{BULLET}</span>
                          <span className="leading-relaxed">{t(`impactFactors.${factor.id}.${ex}`)}</span>
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

      {/* Period Comparisons */}
      <section className="border-border w-full px-4 py-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-3">
          <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {t("periodComparisons.title")}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-4xl text-center md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
            {t("periodComparisons.subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-5 flex w-full max-w-6xl flex-col gap-6 px-0 md:px-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("periodComparisons.preCrisisTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 md:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t("periodComparisons.average")}</span>
                    <span className="text-sm">
                      {formatPercentFixed(
                        preFinancialCrisis.reduce((sum, item) => sum + item.rateUSA, 0) / preFinancialCrisis.length,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t("periodComparisons.range")}</span>
                    <span className="text-sm">
                      {formatPercentRange(
                        Math.min(...preFinancialCrisis.map((item) => item.rateUSA)),
                        Math.max(...preFinancialCrisis.map((item) => item.rateUSA)),
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t("periodComparisons.preCrisisNote")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("periodComparisons.postCrisisTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 md:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t("periodComparisons.average")}</span>
                    <span className="text-sm">
                      {formatPercentFixed(
                        postFinancialCrisis.reduce((sum, item) => sum + item.rateUSA, 0) / postFinancialCrisis.length,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t("periodComparisons.range")}</span>
                    <span className="text-sm">
                      {formatPercentRange(
                        Math.min(...postFinancialCrisis.map((item) => item.rateUSA)),
                        Math.max(...postFinancialCrisis.map((item) => item.rateUSA)),
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t("periodComparisons.postCrisisNote")}</p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-lg">{t("periodComparisons.covidTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 md:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t("periodComparisons.average")}</span>
                    <span className="text-sm">
                      {formatPercentFixed(
                        covidRecession.reduce((sum, item) => sum + item.rateUSA, 0) / covidRecession.length,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t("periodComparisons.range")}</span>
                    <span className="text-sm">
                      {formatPercentRange(
                        Math.min(...covidRecession.map((item) => item.rateUSA)),
                        Math.max(...covidRecession.map((item) => item.rateUSA)),
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t("periodComparisons.covidNote")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Economic Events */}
            <Card className="border-foreground/20 bg-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg">{t("periodComparisons.notableTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col">
                  <div className="font-medium">{t("periodComparisons.ev2001Title")}</div>
                  <div className="text-muted-foreground text-sm">{t("periodComparisons.ev2001Body")}</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">{t("periodComparisons.ev2008Title")}</div>
                  <div className="text-muted-foreground text-sm">{t("periodComparisons.ev2008Body")}</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">{t("periodComparisons.ev2014Title")}</div>
                  <div className="text-muted-foreground text-sm">{t("periodComparisons.ev2014Body")}</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">{t("periodComparisons.ev2020Title")}</div>
                  <div className="text-muted-foreground text-sm">{t("periodComparisons.ev2020Body")}</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">{t("periodComparisons.ev2021Title")}</div>
                  <div className="text-muted-foreground text-sm">{t("periodComparisons.ev2021Body")}</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">{t("periodComparisons.ev2022Title")}</div>
                  <div className="text-muted-foreground text-sm">{t("periodComparisons.ev2022Body")}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What can we do */}
      <section className="bg-secondary/5 w-full px-4 py-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center justify-center gap-3">
          <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {t("whatNext.title")}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-4xl text-center md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
            {t("whatNext.body")}
          </p>
        </div>
      </section>
    </>
  )
}
