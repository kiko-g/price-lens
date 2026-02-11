import { EyeIcon, GitCompareArrowsIcon, PiggyBankIcon } from "lucide-react"

const pillars = [
  {
    icon: EyeIcon,
    title: "Track",
    description: "Monitor daily price changes across Continente, Auchan, and Pingo Doce - automatically.",
  },
  {
    icon: GitCompareArrowsIcon,
    title: "Understand",
    description: "See full price history and trends for any product - not just today's shelf tag.",
  },
  {
    icon: PiggyBankIcon,
    title: "Save",
    description: "Make informed decisions and catch price hikes before they compound into real cost increases.",
  },
]

export function ValueProposition() {
  return (
    <section className="bg-primary/5 w-full px-4 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-5 md:px-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="max-w-4xl text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            How Price Lens helps
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm md:text-lg/relaxed">
            We do the tracking so you can make smarter choices at the supermarket.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col items-center gap-3 text-center md:items-start md:text-left"
            >
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <pillar.icon className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
