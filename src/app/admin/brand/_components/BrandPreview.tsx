"use client"

import { useMemo } from "react"

import { BRAND_MARK_SRC, brandPlaceholders, type BrandSettings } from "@/lib/brand/brand"
import { substituteBrandInString } from "@/lib/brand/messages"
import type { Locale } from "@/i18n/config"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/** A few real message keys so the admin sees the cascade, not a synthetic mock. */
const SAMPLE_MESSAGES: Record<Locale, { key: string; template: string }[]> = {
  pt: [
    { key: "onboarding.welcome.title", template: "Bem-vindo ao {brand}" },
    { key: "layout.pwa.installTitle", template: "Instalar o {brand}" },
    { key: "layout.footer.rights", template: "© {year} {brandLegal}." },
    { key: "ui.share.checkOut", template: "Vê {name} no {brand}" },
  ],
  en: [
    { key: "onboarding.welcome.title", template: "Welcome to {brand}" },
    { key: "layout.pwa.installTitle", template: "Install {brand}" },
    { key: "layout.footer.rights", template: "© {year} {brandLegal}." },
    { key: "ui.share.checkOut", template: "Check out {name} on {brand}" },
  ],
}

type BrandPreviewProps = {
  brand: BrandSettings
  locale: Locale
  isDirty: boolean
}

export function BrandPreview({ brand, locale, isDirty }: BrandPreviewProps) {
  const placeholders = useMemo(() => brandPlaceholders(brand), [brand])
  // Other ICU args stay visible as placeholders; only the brand ones are resolved here.
  const resolve = (template: string) =>
    substituteBrandInString(template, placeholders).replace("{name}", "Leite Mimosa 1L").replace(/''/g, "'")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Where it appears</h2>
        {isDirty ? (
          <Badge variant="warning">Previewing unsaved changes</Badge>
        ) : (
          <Badge variant="outline">Live values</Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Header · logo link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background flex h-12 items-center gap-1.5 rounded-lg border px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_MARK_SRC} alt="" className="size-5" />
            <span className="font-bold tracking-tight">{brand.displayName}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Browser tab · metadata</CardTitle>
          <CardDescription>Root title template, page titles and meta description ({locale}).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <PreviewRow label="Home title" value={brand.displayName} />
          <PreviewRow label="Page title" value={`Favoritos | ${brand.displayName}`} />
          <PreviewRow label="Description" value={brand.metaDescription[locale]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">PWA manifest · install</CardTitle>
          <CardDescription>Home-screen label and install banner.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <PreviewRow label="name" value={brand.displayName} />
          <PreviewRow label="short_name" value={brand.shortName} />
          <div className="mt-1 flex items-center gap-3 rounded-lg border p-2">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND_MARK_SRC} alt="" className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{brand.shortName}</p>
              <p className="text-muted-foreground truncate text-[11px]">{brand.tagline[locale]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Copy · i18n placeholders</CardTitle>
          <CardDescription>
            Messages reference <code>{"{brand}"}</code>, <code>{"{brandShort}"}</code> and <code>{"{brandLegal}"}</code>
            ; resolved once per request.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {SAMPLE_MESSAGES[locale].map((sample) => (
            <PreviewRow key={sample.key} label={sample.key} value={resolve(sample.template)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">OG image · email sender</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2.5 self-start rounded-xl bg-zinc-900 px-4 py-2.5 text-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_MARK_SRC} alt="" className="size-7" />
            <span className="text-base font-semibold tracking-tight">{brand.displayName}</span>
          </div>
          <PreviewRow label="From" value={`${brand.displayName} <onboarding@resend.dev>`} />
        </CardContent>
      </Card>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] items-baseline gap-3">
      <span className="text-muted-foreground truncate font-mono text-xs">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  )
}
