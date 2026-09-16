"use client"

import { useMemo } from "react"

import { brandPlaceholders, type BrandSettings } from "@/lib/brand/brand"
import { LinceMark, type LinceMarkOptions } from "@/components/icons/LinceMark"
import { LinceMarkLab } from "@/app/admin/brand/_components/LinceMarkLab"
import { MarkPreviewSurface } from "@/app/admin/brand/_components/MarkPreviewSurface"
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
  onMarkChange: (mark: LinceMarkOptions) => void
}

export function BrandPreview({ brand, locale, isDirty, onMarkChange }: BrandPreviewProps) {
  const mark = brand.mark
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

      <LinceMarkLab value={mark} onChange={onMarkChange} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sidebar · wordmark + eyebrow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-sidebar flex h-16 items-center gap-2.5 border px-4">
            <LinceMark {...mark} className="size-9 shrink-0" />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-[17px] font-bold tracking-tight">{brand.displayName}</span>
              <span className="eyebrow text-primary mt-1 truncate">{brand.eyebrow[locale]}</span>
            </span>
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
          <CardDescription>Home-screen label and app tile generated from the saved mark.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <PreviewRow label="name" value={brand.displayName} />
          <PreviewRow label="short_name" value={brand.shortName} />
          <div className="mt-1 flex items-center gap-3 rounded-lg border p-2">
            <MarkPreviewSurface theme="navy" className="shrink-0">
              <LinceMark {...mark} logoFashion="tile" className="size-10" />
            </MarkPreviewSurface>
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
          <MarkPreviewSurface theme="navy" className="flex max-w-full items-center gap-2.5 self-start px-4 py-2.5">
            <LinceMark {...mark} className="size-7 shrink-0" />
            <span className="truncate text-base font-semibold tracking-tight">{brand.displayName}</span>
          </MarkPreviewSurface>
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
