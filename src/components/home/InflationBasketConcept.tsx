import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { TrendingUpIcon, MicroscopeIcon, ShoppingBasketIcon } from "lucide-react"

export async function InflationBasketConcept() {
  const t = await getTranslations("home.inflationBasket")
  return (
    <section className="w-full py-12 md:py-16 lg:py-24">
      <div className="mx-auto w-full px-5 md:px-16">
        <div className="flex flex-col items-center justify-center space-y-4 text-center md:items-center">
          <Badge variant="primary">
            <TrendingUpIcon className="h-4 w-4" />
            <span className="font-medium tracking-tighter md:tracking-normal">{t("badge")}</span>
          </Badge>
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="max-w-5xl text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl md:text-xl/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
              {t.rich("body", {
                em: (chunks) => <span className="text-primary font-medium">{chunks}</span>,
              })}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <Button size="lg" variant="default" asChild className="w-full md:w-auto">
              <Link href="/products?priority=3,4,5">
                {t("ctaRelevant")}
                <MicroscopeIcon className="h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild className="w-full md:w-auto">
              <Link href="/products">
                {t("ctaSupermarkets")}
                <ShoppingBasketIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
