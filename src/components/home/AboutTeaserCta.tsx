import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight, TrendingUpIcon, EyeIcon, PiggyBankIcon } from "lucide-react"

const painPoints = [
  { key: "creep", icon: EyeIcon },
  { key: "history", icon: TrendingUpIcon },
  { key: "timing", icon: PiggyBankIcon },
] as const

export async function AboutTeaserCta() {
  const t = await getTranslations("home.aboutTeaser")
  return (
    <section className="w-full px-4 py-10 md:py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("title")}</h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm text-balance">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {painPoints.map((item) => (
            <div key={item.key} className="bg-card flex flex-col gap-2 rounded-xl border p-4">
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                <item.icon className="text-primary size-4" />
              </div>
              <h3 className="text-sm font-semibold">{t(`points.${item.key}.title`)}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{t(`points.${item.key}.text`)}</p>
            </div>
          ))}
        </div>

        <Link
          href="/about"
          className="bg-card hover:bg-accent group flex items-center justify-between rounded-xl border p-4 transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{t("cta.title")}</span>
            <span className="text-muted-foreground text-xs">{t("cta.body")}</span>
          </div>
          <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
