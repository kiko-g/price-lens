"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/magicui/border-beam"

const chartDataA = [
  { month: "January", price: 4.99, priceRecommended: 5.99, discount: 17, pricePerUnit: 9.99 },
  { month: "February", price: 5.49, priceRecommended: 5.99, discount: 8, pricePerUnit: 10.98 },
  { month: "March", price: 5.99, priceRecommended: 6.49, discount: 8, pricePerUnit: 11.98 },
  { month: "April", price: 5.49, priceRecommended: 6.49, discount: 15, pricePerUnit: 10.98 },
  { month: "May", price: 4.99, priceRecommended: 6.49, discount: 23, pricePerUnit: 9.99 },
  { month: "June", price: 5.99, priceRecommended: 6.99, discount: 14, pricePerUnit: 11.98 },
  { month: "July", price: 6.49, priceRecommended: 6.99, discount: 7, pricePerUnit: 12.98 },
  { month: "August", price: 5.99, priceRecommended: 6.99, discount: 14, pricePerUnit: 11.98 },
  { month: "September", price: 5.49, priceRecommended: 6.49, discount: 15, pricePerUnit: 10.98 },
  { month: "October", price: 4.99, priceRecommended: 6.49, discount: 23, pricePerUnit: 9.99 },
  { month: "November", price: 5.99, priceRecommended: 6.99, discount: 14, pricePerUnit: 11.98 },
  { month: "December", price: 6.49, priceRecommended: 6.99, discount: 7, pricePerUnit: 16.0 },
]

const chartConfigA = {
  price: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
  pricePerUnit: {
    label: "Price Per Unit",
    color: "hsl(var(--chart-2))",
  },
  priceRecommended: {
    label: "Price Recommended",
    color: "hsl(var(--chart-3))",
  },
  discount: {
    label: "Discount %",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function MockChartA({ className }: { className?: string }) {
  return (
    <Card className={cn("relative", className)}>
      <CardHeader>
        <CardTitle>Price Evolution</CardTitle>
        <CardDescription>January - December 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigA}>
          <LineChart
            accessibilityLayer
            data={chartDataA}
            margin={{
              left: 0,
              right: 0,
              top: 8,
              bottom: 8,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              yAxisId="price"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 8]}
              tickFormatter={(value) => `€${value}`}
              width={40}
            />
            <YAxis
              yAxisId="discount"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              width={40}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              yAxisId="price"
              dataKey="price"
              type="linear"
              stroke="var(--color-price)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="price"
              dataKey="priceRecommended"
              type="linear"
              stroke="var(--color-priceRecommended)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="price"
              dataKey="pricePerUnit"
              type="linear"
              stroke="var(--color-pricePerUnit)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="discount"
              dataKey="discount"
              type="linear"
              stroke="var(--color-discount)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Showing price points for the last 6 months
            </div>
          </div>
        </div>
      </CardFooter>

      <BorderBeam duration={5} size={150} colorFrom="#2662d9" colorTo="#e23670" />
    </Card>
  )
}
