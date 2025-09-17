/**
 * Shared font loading utility for Open Graph image generation
 */

export type FontAsset = {
  name: string
  data: Buffer
  weight: 400 | 600
  style: "normal"
}

export async function loadGeistFonts(): Promise<FontAsset[]> {
  const [{ base64Font: normal }, { base64Font: mono }, { base64Font: semibold }] = await Promise.all([
    import("@/app/(app)/og/geist-regular-otf.json").then((mod) => mod.default || mod),
    import("@/app/(app)/og/geistmono-regular-otf.json").then((mod) => mod.default || mod),
    import("@/app/(app)/og/geist-semibold-otf.json").then((mod) => mod.default || mod),
  ])

  return [
    {
      name: "Geist",
      data: Buffer.from(normal, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist Mono",
      data: Buffer.from(mono, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(semibold, "base64"),
      weight: 600 as const,
      style: "normal" as const,
    },
  ]
}

export async function loadGeistFontsLight(): Promise<FontAsset[]> {
  const [{ base64Font: normal }, { base64Font: semibold }] = await Promise.all([
    import("@/app/(app)/og/geist-regular-otf.json").then((mod) => mod.default || mod),
    import("@/app/(app)/og/geist-semibold-otf.json").then((mod) => mod.default || mod),
  ])

  return [
    {
      name: "Geist",
      data: Buffer.from(normal, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(semibold, "base64"),
      weight: 600 as const,
      style: "normal" as const,
    },
  ]
}
