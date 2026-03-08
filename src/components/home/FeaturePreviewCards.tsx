import { MapPinIcon, PiggyBankIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: MapPinIcon,
    title: "I'm at the store",
    description: "Pick your store. See what's worth buying today from your favorites and lists.",
  },
  {
    icon: PiggyBankIcon,
    title: "Track your savings",
    description: "See how much you've saved over time by shopping smarter with Price Lens.",
  },
]

export function FeaturePreviewCards() {
  return (
    <section className="w-full px-4 py-16">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="bg-card flex flex-col gap-3 rounded-xl border p-5 opacity-80">
            <div className="flex items-center justify-between">
              <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                <feature.icon className="text-muted-foreground size-4.5" />
              </div>
              <Badge variant="outline" className="text-muted-foreground text-[10px] font-medium">
                Coming soon
              </Badge>
            </div>
            <h3 className="text-sm font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
