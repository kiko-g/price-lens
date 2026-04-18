"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { deleteAccount, signOut } from "@/app/login/actions"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageToggle } from "@/components/layout/LanguageToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { BugIcon, LogOutIcon, MailIcon, PlusIcon, TrashIcon } from "lucide-react"

const contactLinks = [
  { key: "questions", icon: MailIcon, href: "mailto:kikojpgoncalves@gmail.com" },
  { key: "bug", icon: BugIcon, href: "https://github.com/kiko-g/pricelens/issues" },
  { key: "feature", icon: PlusIcon, href: "https://github.com/kiko-g/pricelens/issues" },
] as const

export function SettingsTab() {
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useTranslations("profile.settings")
  const tCommon = useTranslations("common")

  async function handleDeleteAccount() {
    if (!confirm(t("danger.confirm"))) return
    setIsDeleting(true)
    try {
      await deleteAccount()
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error(t("danger.error"))
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">{tCommon("labels.appearance")}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{tCommon("labels.theme")}</p>
            <p className="text-muted-foreground text-xs">{t("appearance.themeHint")}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{tCommon("labels.language")}</p>
            <p className="text-muted-foreground text-xs">{t("appearance.languageHint")}</p>
          </div>
          <LanguageToggle variant="segmented" />
        </div>
      </section>

      <Separator />

      {/* Contact & Feedback */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">{t("contact.title")}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {contactLinks.map((item) => (
            <Link key={item.key} href={item.href} className="block">
              <Card className="hover:bg-accent hover:text-accent-foreground h-full transition-colors">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {t(`contact.links.${item.key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1.5">
                  <p className="text-muted-foreground text-xs">{t(`contact.links.${item.key}.description`)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* Account */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">{tCommon("labels.account")}</h3>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium">{t("account.signOutTitle")}</p>
            <p className="text-muted-foreground text-xs">{t("account.signOutHint")}</p>
          </div>

          <Button variant="outline" size="sm" onClick={() => signOut()} className="w-fit">
            <LogOutIcon className="h-4 w-4" />
            {tCommon("actions.signOut")}
          </Button>
        </div>
      </section>

      <Separator />

      {/* Danger zone */}
      <section className="space-y-3">
        <h3 className="text-destructive text-base font-semibold">{t("danger.title")}</h3>
        <p className="text-muted-foreground text-xs">{t("danger.body")}</p>
        <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
          <TrashIcon className="h-4 w-4" />
          {isDeleting ? t("danger.deleting") : t("danger.deleteAction")}
        </Button>
      </section>
    </div>
  )
}
