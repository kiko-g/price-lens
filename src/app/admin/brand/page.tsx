"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale } from "next-intl"
import { AlertCircleIcon, RotateCcwIcon, SaveIcon } from "lucide-react"

import { BRAND_DEFAULTS, brandSettingsSchema, type BrandSettings } from "@/lib/brand/brand"
import { isLocale, locales, type Locale } from "@/i18n/config"
import { useBrandSettings, useUpdateBrandSettings } from "@/hooks/useBrandSettings"

import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { BrandPreview } from "./_components/BrandPreview"

const LOCALE_LABELS: Record<Locale, string> = { pt: "Português", en: "English" }
// PT-first voice: edit and preview Portuguese before English.
const VOICE_LOCALES: Locale[] = ["pt", ...locales.filter((locale) => locale !== "pt")]

export default function BrandControlCenterPage() {
  const { data, isPending, error } = useBrandSettings()

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 lg:px-10 xl:overflow-hidden">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Brand Control Center</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Single source of truth for the product name and brand copy. Changing the display name cascades to the header,
          metadata, PWA manifest, footer, onboarding, emails and OG images — no code change required.
        </p>
      </header>

      {error ? (
        <Callout variant="destructive" icon={AlertCircleIcon}>
          Could not load brand settings: {error instanceof Error ? error.message : "unknown error"}
        </Callout>
      ) : isPending || !data ? (
        <BrandFormSkeleton />
      ) : (
        <BrandEditor initial={data.brand} updatedAt={data.updatedAt} />
      )}
    </div>
  )
}

function BrandEditor({ initial, updatedAt }: { initial: BrandSettings; updatedAt: string | null }) {
  const activeLocale = useLocale()
  const [previewLocale, setPreviewLocale] = useState<Locale>(isLocale(activeLocale) ? activeLocale : "pt")
  const update = useUpdateBrandSettings()

  const form = useForm<BrandSettings>({
    resolver: zodResolver(brandSettingsSchema),
    defaultValues: initial,
    mode: "onChange",
  })

  // Re-sync when the server row changes (e.g. after a save in another tab).
  useEffect(() => {
    form.reset(initial)
  }, [initial, form])

  const values = form.watch()
  const isDirty = form.formState.isDirty

  const handleSubmit = form.handleSubmit(async (input) => {
    const saved = await update.mutateAsync(input)
    form.reset(saved.brand)
  })

  const handleResetToDefaults = () => {
    form.reset(BRAND_DEFAULTS, { keepDefaultValues: true })
  }

  return (
    <div className="grid min-h-0 flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:overflow-hidden">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-6 xl:h-full">
          <div className="flex flex-col gap-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
            <section className="flex flex-col gap-4">
              <SectionHeading title="Identity" description="Locale-neutral. These are the values that must cascade." />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
                    </FormControl>
                    <FormDescription>
                      Header wordmark, page titles, splash, OG badge, email sender and every <code>{"{brand}"}</code>{" "}
                      placeholder in the copy.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={12} autoComplete="off" />
                      </FormControl>
                      <FormDescription>PWA home-screen label (≤ 12 chars).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal / footer name</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormDescription>
                        Copyright line and <code>{"{brandLegal}"}</code> placeholders.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {VOICE_LOCALES.map((locale) => (
              <section key={locale} className="flex flex-col gap-4">
                <SectionHeading
                  title={`Voice · ${LOCALE_LABELS[locale]}`}
                  description={
                    locale === "pt"
                      ? "Primary voice. Sharp, clean, no slop."
                      : "Secondary locale; keep it aligned with PT."
                  }
                />
                <FormField
                  control={form.control}
                  name={`eyebrow.${locale}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eyebrow</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={32} autoComplete="off" />
                      </FormControl>
                      <FormDescription>
                        Small-caps line under the wordmark (system language, not the name).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`tagline.${locale}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormDescription>Sidebar footer, OG stats card, install banner.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`metaDescription.${locale}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormDescription>
                        Root metadata, Open Graph, Twitter card and manifest description.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t py-3 xl:shrink-0">
            <Button type="submit" disabled={!isDirty || update.isPending || !form.formState.isValid}>
              <SaveIcon className="size-4" />
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => form.reset(initial)} disabled={!isDirty}>
              Discard
            </Button>
            <Button type="button" variant="ghost" onClick={handleResetToDefaults}>
              <RotateCcwIcon className="size-4" />
              Load code defaults
            </Button>
            <span className="text-muted-foreground ml-auto text-xs">
              {updatedAt ? `Last saved ${formatSavedAt(updatedAt)}` : "Not saved yet — using code defaults"}
            </span>
          </div>
        </form>
      </Form>

      <aside className="flex flex-col gap-4 xl:min-h-0 xl:overflow-y-auto">
        <Tabs value={previewLocale} onValueChange={(value) => isLocale(value) && setPreviewLocale(value)}>
          <TabsList>
            {VOICE_LOCALES.map((locale) => (
              <TabsTrigger key={locale} value={locale}>
                {LOCALE_LABELS[locale]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <BrandPreview brand={values} locale={previewLocale} isDirty={isDirty} />
      </aside>
    </div>
  )
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" })
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  )
}

function BrandFormSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  )
}
