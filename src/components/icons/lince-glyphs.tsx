import type { SVGProps } from "react"

/**
 * Lince glyphs — navigation icons derived from the pulse-ring mark.
 * Every glyph is a ring (r 8.5 on a 24px grid) with one gesture inside, stroke 1.6.
 * Use Lucide for utility icons (close, chevron, external); use these for brand navigation.
 */
type GlyphProps = SVGProps<SVGSVGElement>

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx={12} cy={12} r={8.5} />
      {children}
    </svg>
  )
}

/** Início — the pulse: ring with a solid core. */
export function GlyphHome(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx={12} cy={12} r={2.6} fill="currentColor" stroke="none" />
    </Glyph>
  )
}

/** Explorar — a price line crossing the ring. */
export function GlyphExplore(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M7.5 14.5l2.6-4 2.4 3 3.6-5" />
    </Glyph>
  )
}

/** Promoções — a drop inside the ring. */
export function GlyphDeals(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 7.5v8.5m0 0l-3.2-3.2M12 16l3.2-3.2" />
    </Glyph>
  )
}

/** Favoritos — heartbeat through the ring. */
export function GlyphFavorites(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 12h3.4l1.8-3 2.4 6 2-4 1.6 1H20" />
    </Glyph>
  )
}

/** Perfil — person inside the ring. */
export function GlyphProfile(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx={12} cy={10} r={2.4} />
      <path d="M7.8 17c1-2.6 7.4-2.6 8.4 0" />
    </Glyph>
  )
}

/** Sobre — a faceted "i". */
export function GlyphAbout(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 11v5" />
      <path d="M12 7.6l.9.9-.9.9-.9-.9z" fill="currentColor" stroke="none" />
    </Glyph>
  )
}

/** Obter a app — phone silhouette. */
export function GlyphApp(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9.5 7.5h5v9h-5z" />
      <path d="M11.2 14.8h1.6" />
    </Glyph>
  )
}

/** Admin — faceted core (staff). */
export function GlyphAdmin(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 7.5l3.9 2.25v4.5L12 16.5l-3.9-2.25v-4.5z" />
      <path d="M12 12v4.5M12 12l3.9-2.25M12 12L8.1 9.75" />
    </Glyph>
  )
}

/** Pesquisar — ring as the lens, handle out. */
export function GlyphSearch(props: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx={10.5} cy={10.5} r={7} />
      <path d="M15.6 15.6L21 21" />
    </svg>
  )
}

/** Código de barras — bars inside the ring. */
export function GlyphScan(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M8.5 9v6M11 9v6M13.5 9v6M15.5 9v6" />
    </Glyph>
  )
}
