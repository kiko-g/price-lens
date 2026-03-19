import Link from "next/link"
import { ArrowRight, TrendingUpIcon, EyeIcon, PiggyBankIcon } from "lucide-react"

const painPoints = [
  {
    icon: EyeIcon,
    title: "Invisible price creep",
    text: "Small hikes on everyday products add up to hundreds of euros you never noticed losing.",
  },
  {
    icon: TrendingUpIcon,
    title: "Full price history",
    text: "See exactly how a product's price has moved over weeks and months across stores.",
  },
  {
    icon: PiggyBankIcon,
    title: "Buy at the right time",
    text: "Most products cycle through discounts. Price Lens shows you when prices drop.",
  },
]

export function AboutTeaserCta() {
  return (
    <section className="w-full px-4 py-10 md:py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">Why track prices?</h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm text-balance">
            Portuguese grocery inflation hit 20%+ over the last 5 years. Small savings compound.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {painPoints.map((item) => (
            <div key={item.title} className="bg-card flex flex-col gap-2 rounded-xl border p-4">
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                <item.icon className="text-primary size-4" />
              </div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <Link
          href="/about"
          className="bg-card hover:bg-accent group flex items-center justify-between rounded-xl border p-4 transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Understand the bigger picture</span>
            <span className="text-muted-foreground text-xs">
              See the data behind Portuguese grocery inflation and how Price Lens helps.
            </span>
          </div>
          <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
