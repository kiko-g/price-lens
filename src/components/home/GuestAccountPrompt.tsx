import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

/** One account explanation. Search and prices above already work without signing in. */
export async function GuestAccountPrompt() {
  const t = await getTranslations("home.guestAccount")

  return (
    <section className="border-border bg-card rounded-xl border p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-balance">{t("title")}</h2>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{t("body")}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        <li className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm">{t("without")}</li>
        <li className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm">{t("with")}</li>
      </ul>
      <Button asChild size="lg" className="mt-5">
        <Link href="/login">
          <GoogleIcon />
          {t("cta")}
        </Link>
      </Button>
    </section>
  )
}
