import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { PlusSquareIcon, ShareIcon } from "lucide-react"
import { siteConfig } from "@/lib/config"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

export function RichLineBreak() {
  return <br />
}

export function HeroSubtitleStrongMobile(chunks: ReactNode) {
  return <strong className="text-foreground dark:text-foreground font-semibold">{chunks}</strong>
}

export function HeroSubtitleStrongDesktop(chunks: ReactNode) {
  return <strong className="text-foreground dark:text-foreground font-bold">{chunks}</strong>
}

export function PwaRichStrong(chunks: ReactNode) {
  return <strong>{chunks}</strong>
}

export function PwaIosShareIconInline() {
  return <ShareIcon className="mb-0.5 inline size-3.5" />
}

export function PwaIosPlusIconInline() {
  return <PlusSquareIcon className="mb-0.5 inline size-3.5" />
}

export function FooterBuiltByLink(chunks: ReactNode) {
  return (
    <Link
      target="_blank"
      href={siteConfig.links.github}
      className="inline-flex items-center gap-2 font-medium text-zinc-900 hover:underline hover:opacity-80 dark:text-white"
    >
      {chunks}
      <Image src="/profile.svg" alt="" width={24} height={24} className="rounded-full" />
    </Link>
  )
}

export function FooterOpenSourceLink(chunks: ReactNode) {
  return (
    <Link
      target="_blank"
      href={siteConfig.links.repo}
      className="inline-flex items-center gap-2 font-semibold text-zinc-900 hover:underline hover:opacity-80 dark:text-white"
    >
      {chunks}
    </Link>
  )
}

export function InflationBasketEm(chunks: ReactNode) {
  return <span className="text-primary font-medium">{chunks}</span>
}

export function RichStrongDestructive(chunks: ReactNode) {
  return <strong className="text-destructive">{chunks}</strong>
}

export function RichStrongForeground(chunks: ReactNode) {
  return <strong className="text-foreground">{chunks}</strong>
}

export function RichStrongForegroundBold(chunks: ReactNode) {
  return <strong className="text-foreground font-bold">{chunks}</strong>
}

export function InflationContextAboutLink(chunks: ReactNode) {
  return (
    <Link href="/about" className="text-primary hover:underline">
      {chunks}
    </Link>
  )
}

export function PricingFooterMailLink(chunks: ReactNode) {
  return (
    <Link
      href="mailto:kikojpgoncalves@gmail.com"
      className="text-secondary hover:text-secondary/80 underline underline-offset-4"
    >
      {chunks}
    </Link>
  )
}

export function SavingsSpotlightHighlight(chunks: ReactNode) {
  return <span className="text-primary">{chunks}</span>
}

export function IdenticalCompareHighlight(chunks: ReactNode) {
  return <span className="text-primary font-medium">{chunks}</span>
}

export function IdenticalSavingsHintHighlight(chunks: ReactNode) {
  return <span className="text-primary font-semibold">{chunks}</span>
}

export function RichMonoMedium(chunks: ReactNode) {
  return <span className="font-mono font-medium">{chunks}</span>
}

export function OffLookupOffIconInline() {
  return <OpenFoodFactsIcon className="inline h-4 w-4" />
}

export function BarcodeNotFoundOffLabel(chunks: ReactNode) {
  return (
    <span className="inline-flex items-center gap-1 font-bold">
      <OpenFoodFactsIcon className="inline h-4 w-4" /> {chunks}
    </span>
  )
}

export function NavSheetBuiltByName(chunks: ReactNode) {
  return <span className="font-medium">{chunks}</span>
}

export function RichSpanForegroundMedium(chunks: ReactNode) {
  return <span className="text-foreground font-medium">{chunks}</span>
}

export function OffAllergensStrong(chunks: ReactNode) {
  return <span className="font-semibold">{chunks}</span>
}

export function BarcodeCompareSaveHighlight(chunks: ReactNode) {
  return <span className="text-success font-semibold">{chunks}</span>
}

export function RichSpanForegroundSemibold(chunks: ReactNode) {
  return <span className="text-foreground font-semibold">{chunks}</span>
}

export function RichSpanMutedSoft(chunks: ReactNode) {
  return <span className="text-muted-foreground/80">{chunks}</span>
}

export function ChartFreqMostCommonStrong(chunks: ReactNode) {
  return <span className="text-success font-bold">{chunks}</span>
}

export function ChartFreqNotMostCommonStrong(chunks: ReactNode) {
  return <span className="text-destructive font-bold">{chunks}</span>
}
