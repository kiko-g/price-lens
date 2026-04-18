import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { pageMetadataFromKey } from "@/lib/config"
import { Layout } from "@/components/layout"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("terms")
}

export default async function TermsPage() {
  const t = await getTranslations("legal.terms")
  return (
    <Layout>
      <div className="container mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12">
        <div className="prose dark:prose-invert mb-16">
          <h1>{t("heading")}</h1>
          <p>{t("intro")}</p>

          <h2>{t("sections.license.title")}</h2>
          <p>{t("sections.license.body")}</p>
          <ul>
            <li>{t("sections.license.items.modify")}</li>
            <li>{t("sections.license.items.commercial")}</li>
            <li>{t("sections.license.items.reverse")}</li>
            <li>{t("sections.license.items.copyright")}</li>
            <li>{t("sections.license.items.transfer")}</li>
          </ul>
          <p>{t("sections.license.termination")}</p>

          <h2>{t("sections.disclaimer.title")}</h2>
          <p>{t("sections.disclaimer.body")}</p>

          <h2>{t("sections.limitations.title")}</h2>
          <p>{t("sections.limitations.body")}</p>

          <h2>{t("sections.governingLaw.title")}</h2>
          <p>{t("sections.governingLaw.body")}</p>
        </div>
      </div>
    </Layout>
  )
}
