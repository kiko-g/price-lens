import { Card, CardContent } from "@/components/ui/card"

import { CalendarIcon, CalendarDaysIcon, CalendarRangeIcon, TrendingUpIcon } from "lucide-react"

const timeframes = [
  {
    label: "Monthly",
    rate: "+0.3%",
    note: "Barely noticeable",
    icon: CalendarIcon,
    barWidth: "w-[8%]",
  },
  {
    label: "After 1 Year",
    rate: "+3.7%",
    note: "Starting to add up",
    icon: CalendarDaysIcon,
    barWidth: "w-[40%]",
  },
  {
    label: "After 5 Years",
    rate: "+20%",
    note: "That's real money",
    icon: CalendarRangeIcon,
    barWidth: "w-full",
  },
]

export function PriceCreep() {
  return (
    <section className="w-full px-4 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-5 md:px-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="max-w-4xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            The invisible price creep
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm md:text-lg/relaxed">
            Prices don&apos;t jump - they creep. A tiny increase each month seems like nothing. But compound it over
            time and the picture changes completely.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {timeframes.map((tf) => (
            <Card key={tf.label} className="relative overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-2">
                  <tf.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium tracking-tight">{tf.label}</span>
                </div>

                <div className="text-destructive text-3xl font-bold tracking-tight">{tf.rate}</div>

                <div className="flex flex-col gap-1.5">
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div className={`bg-destructive h-full rounded-full ${tf.barWidth}`} />
                  </div>
                  <span className="text-muted-foreground text-xs">{tf.note}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-destructive/10 border-destructive/20 flex items-start gap-3 rounded-lg border p-4 md:items-center md:p-5">
          <TrendingUpIcon className="text-destructive mt-0.5 h-5 w-5 shrink-0 md:mt-0" />
          <p className="text-sm md:text-base">
            Each month the increase is too small to care about. But compounded over time, your grocery bill is
            significantly higher - and no one asked for your permission.
          </p>
        </div>
      </div>
    </section>
  )
}
