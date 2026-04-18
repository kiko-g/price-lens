import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { pageMetadataFromKey } from "@/lib/config"
import { Layout } from "@/components/layout"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadataFromKey("privacy")
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy")
  return (
    <Layout>
      <div className="container mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12">
        <div className="prose dark:prose-invert mb-16">
          <h1>{t("heading")}</h1>
          <p>{t("intro")}</p>

          <h2>{t("sections.collect.title")}</h2>
          <p>{t("sections.collect.body1")}</p>
          <p>{t("sections.collect.body2")}</p>

          <h2>{t("sections.use.title")}</h2>
          <p>{t("sections.use.body")}</p>

          <h2>{t("sections.storage.title")}</h2>
          <p>{t("sections.storage.body1")}</p>
          <p>{t("sections.storage.body2")}</p>

          <h2>{t("sections.rights.title")}</h2>
          <p>{t("sections.rights.body")}</p>

          <h2>{t("sections.contact.title")}</h2>
          <p>{t("sections.contact.body")}</p>
        </div>
      </div>
    </Layout>
  )
}
