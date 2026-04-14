/** Tuned for small rounded cards (not full-viewport heroes). */
const CARD_LENGTH = "170%"

export type DealTierLightRaysPreset = {
  color: string
  count: number
  blur: number
  speed: number
  length: string
}

/** Identical-products row when this listing is at the floor price (violet tint — matches `border-secondary` highlight). */
export const floorCompareLightRaysPreset: DealTierLightRaysPreset = {
  color: "rgba(124, 58, 237, 0.13)",
  count: 5,
  blur: 28,
  speed: 16,
  length: CARD_LENGTH,
}
