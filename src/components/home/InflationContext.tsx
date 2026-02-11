"use client"

import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

import { TrendingUpIcon } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

const inflationData = [
  { year: 1999, rateUSA: 2.2, ratePT: 2.2, rateEU: 1.1 },
  { year: 2000, rateUSA: 3.4, ratePT: 2.8, rateEU: 2.2 },
  { year: 2001, rateUSA: 2.8, ratePT: 4.4, rateEU: 2.3 },
  { year: 2002, rateUSA: 1.6, ratePT: 3.7, rateEU: 2.3 },
  { year: 2003, rateUSA: 2.3, ratePT: 3.3, rateEU: 2.1 },
  { year: 2004, rateUSA: 2.7, ratePT: 2.5, rateEU: 2.1 },
  { year: 2005, rateUSA: 3.4, ratePT: 2.1, rateEU: 2.2 },
  { year: 2006, rateUSA: 3.2, ratePT: 3.0, rateEU: 2.2 },
  { year: 2007, rateUSA: 2.8, ratePT: 2.4, rateEU: 2.1 },
  { year: 2008, rateUSA: 3.8, ratePT: 2.7, rateEU: 3.3 },
  { year: 2009, rateUSA: -0.4, ratePT: -0.9, rateEU: 0.3 },
  { year: 2010, rateUSA: 1.6, ratePT: 1.4, rateEU: 1.6 },
  { year: 2011, rateUSA: 3.1, ratePT: 3.6, rateEU: 2.7 },
  { year: 2012, rateUSA: 2.1, ratePT: 2.8, rateEU: 2.5 },
  { year: 2013, rateUSA: 1.5, ratePT: 0.4, rateEU: 1.4 },
  { year: 2014, rateUSA: 0.1, ratePT: -0.2, rateEU: 0.4 },
  { year: 2015, rateUSA: 0.1, ratePT: 0.5, rateEU: 0.0 },
  { year: 2016, rateUSA: 1.3, ratePT: 0.6, rateEU: 0.3 },
  { year: 2017, rateUSA: 2.1, ratePT: 1.6, rateEU: 1.5 },
  { year: 2018, rateUSA: 2.4, ratePT: 1.2, rateEU: 1.8 },
  { year: 2019, rateUSA: 1.8, ratePT: 0.3, rateEU: 1.2 },
  { year: 2020, rateUSA: 1.2, ratePT: -0.1, rateEU: 0.3 },
  { year: 2021, rateUSA: 4.7, ratePT: 1.3, rateEU: 2.6 },
  { year: 2022, rateUSA: 8.0, ratePT: 7.8, rateEU: 8.4 },
  { year: 2023, rateUSA: 4.1, ratePT: 5.3, rateEU: 5.4 },
  { year: 2024, rateUSA: 3.2, ratePT: 2.3, rateEU: 2.4 },
]

const cumulativeInflation = inflationData.reduce(
  (acc, item) => {
    const last = acc[acc.length - 1]
    acc.push({
      year: item.year,
      usa: last.usa * (1 + item.rateUSA / 100),
      pt: last.pt * (1 + item.ratePT / 100),
      eu: last.eu * (1 + item.rateEU / 100),
    })
    return acc
  },
  [{ year: 1999, usa: 100, pt: 100, eu: 100 }],
)

const latestPT = cumulativeInflation[cumulativeInflation.length - 1].pt

const chartConfig = {
  usa: { label: "United States", color: "var(--chart-1)" },
  pt: { label: "Portugal", color: "var(--chart-2)" },
  eu: { label: "Eurozone", color: "var(--chart-4)" },
}

export function InflationContext() {
  return (
    <section className="w-full px-4 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-5 md:px-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="max-w-4xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            It&apos;s not just groceries
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm md:text-lg/relaxed">
            Inflation compounds silently. Since 1999, €100 worth of goods in Portugal now costs{" "}
            <strong className="text-destructive">€{latestPT.toFixed(0)}</strong>. The same pattern repeats at the
            product level - which is exactly what Price Lens tracks.
          </p>
        </div>

        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUpIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              Cumulative Inflation (1999–2024)
            </CardTitle>
            <CardDescription className="text-sm">
              What €100 from 1999 looks like today for Portugal, the USA, and the Eurozone.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ChartContainer config={chartConfig} className="h-[250px] w-full sm:h-[300px]">
              <LineChart data={cumulativeInflation}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 400 }}
                  dataKey="year"
                  interval="preserveStartEnd"
                  tickMargin={8}
                  domain={[1999, 2024]}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 400 }}
                  tickMargin={8}
                  width={35}
                  domain={[100, 200]}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="usa"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  name="United States"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="pt"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  name="Portugal"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="eu"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  name="Eurozone"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-xs md:text-sm">
          Historical CPI-U data from US Bureau of Labor Statistics, Eurostat, and INE Portugal.{" "}
          <Link href="/about" className="text-primary hover:underline">
            See the full inflation analysis →
          </Link>
        </p>
      </div>
    </section>
  )
}
