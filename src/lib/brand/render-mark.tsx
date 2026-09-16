import { renderToReadableStream } from "react-dom/server.edge"

import { LinceMarkSvg } from "@/components/icons/LinceMark"
import type { LinceMarkOptions } from "@/lib/brand/mark"

/** Standalone assets reuse the React geometry; resolve theme classes for SVG/PNG consumers. */
export async function renderBrandMark(
  mark: LinceMarkOptions,
  { theme = "navy", tile = false }: { theme?: "navy" | "paper"; tile?: boolean } = {},
): Promise<string> {
  const foreground = theme === "navy" ? "#e8ebf2" : "#14181f"
  const palette: Record<string, string> = {
    foreground,
    background: theme === "navy" ? "#0b0f1a" : "#f6f3ee",
    primary: theme === "navy" ? "#fe5a1b" : "#e83918",
    "primary-200": "#ffcdad",
    "primary-400": "#ff8551",
    "primary-700": "#bb2819",
    "base-700": "#303b53",
    "base-900": "#111726",
    "base-950": "#0b0f1a",
    white: "#ffffff",
    black: "#000000",
    current: "currentColor",
  }
  const stream = await renderToReadableStream(
    <LinceMarkSvg
      instanceId="asset"
      {...mark}
      logoFashion={tile ? "tile" : mark.logoFashion}
      pulseAnimation="static"
      width={64}
      height={64}
      color={foreground}
      xmlns="http://www.w3.org/2000/svg"
    />,
  )
  let svg = await new Response(stream).text()
  svg = svg
    .replace(/class="([^"]*)"/g, (_, classes: string) => {
      const styles: string[] = []
      for (const name of classes.split(" ")) {
        const paint = /^(fill|stroke|text)-([^/]+)(?:\/(\d+))?$/.exec(name)
        if (paint) {
          const [, kind, token, opacity] = paint
          const color = palette[token] ?? (/^\[#[0-9a-f]+\]$/i.test(token) ? token.slice(1, -1) : undefined)
          if (color) {
            const property = kind === "text" ? "color" : kind
            styles.push(`${property}:${color}`)
            if (opacity) styles.push(`${property}-opacity:${Number(opacity) / 100}`)
          }
        }
        if (!mark.monochrome && (name.includes("drop-shadow") || name === "lince-hunter-backlight"))
          styles.push("filter:url(#brand-glow)")
      }
      return styles.length ? `style="${styles.join(";")}"` : ""
    })
    .replace(/var\(--(foreground|background|primary)\)/g, (_, token: string) => palette[token])

  const glow =
    '<defs><filter id="brand-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
  svg = svg.replace(/(<svg[^>]*>)/, `$1${mark.monochrome ? "" : glow}`)
  if (tile) {
    svg = svg
      .replace(
        /(<svg[^>]*>)/,
        '$1<rect width="64" height="64" fill="#0b0f1a"/><g transform="translate(4.8 4.8) scale(.85)">',
      )
      .replace(/<\/svg>$/, "</g></svg>")
  } else if (mark.logoFashion !== "tile" && mark.pulseShapePattern !== "none") {
    svg = svg.replace('viewBox="0 0 64 64"', 'viewBox="-10 -10 84 84"')
  }
  return svg
}
