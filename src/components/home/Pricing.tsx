import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/magic/border-beam"

const freeKeys = ["history14", "basket", "compare", "weeklyAlerts"] as const
const plusKeys = [
  "everythingFree",
  "fullHistory",
  "unlimitedTracking",
  "dailyReports",
  "insights",
  "shoppingList",
  "ppCalculator",
  "exportApi",
] as const

export async function PricingSection() {
  const isComingSoon = true
  const t = await getTranslations("home.pricing")

  return (
    <section className="w-full bg-linear-to-b py-12 md:py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="animate-fade-in text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="animate-fade-in text-muted-foreground max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <div className="animate-fade-in mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:mt-12 lg:gap-10">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-col space-y-1.5 p-6">
              <CardTitle className="text-2xl font-bold">{t("free.name")}</CardTitle>
              <CardDescription>{t("free.description")}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-muted-foreground ml-1">{t("perMonth")}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              <ul className="space-y-3">
                {freeKeys.map((key) => (
                  <li className="flex items-center gap-1.5" key={`free-${key}`}>
                    <CheckIcon className="size-4 shrink-0" />
                    <span className="text-sm md:text-base">{t(`free.items.${key}` as const)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button asChild className="w-full" variant="outline">
                <Link href="/login">{t("free.cta")}</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Plus Plan */}
          <Card className="dark:from-secondary-900 dark:to-secondary-950 relative flex flex-col overflow-hidden bg-linear-to-br from-slate-100 to-slate-200 dark:bg-linear-to-br">
            <BorderBeam
              duration={5}
              size={200}
              borderWidth={2}
              colorFrom="var(--color-secondary-300)"
              colorTo="var(--color-secondary-400)"
            />

            {!isComingSoon && (
              <span className="from-secondary/70 to-secondary/70 absolute top-0 right-0 rounded-bl-xl bg-linear-to-r px-3 py-1 text-xs font-medium text-white">
                {t("popular")}
              </span>
            )}

            <CardHeader className="flex flex-col space-y-1.5 p-6">
              <CardTitle className="text-2xl font-bold">{t("plus.name")}</CardTitle>
              <CardDescription>{t("plus.description")}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€5</span>
                <span className="text-muted-foreground ml-1">{t("perMonth")}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              <ul className="space-y-3">
                {plusKeys.map((key) => (
                  <li className="flex items-center gap-1.5" key={`plus-${key}`}>
                    <CheckIcon className="size-4 shrink-0" />
                    <span className="text-sm md:text-base">{t(`plus.items.${key}` as const)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button disabled={isComingSoon} className="w-full" variant="white">
                {isComingSoon ? t("comingSoon") : t("plus.cta")}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            {t.rich("footer", {
              link: (chunks) => (
                <Link
                  href="mailto:kikojpgoncalves@gmail.com"
                  className="text-secondary hover:text-secondary/80 underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </div>
    </section>
  )
}
