import { StoreOrigin, type StoreScraper } from "./types"
import { auchanScraper } from "./origins/auchan"
import { continenteScraper } from "./origins/continente"
import { pingoDoceScraper } from "./origins/pingo-doce"

const scraperMap: Record<number, StoreScraper> = {
  [StoreOrigin.Continente]: continenteScraper,
  [StoreOrigin.Auchan]: auchanScraper,
  [StoreOrigin.PingoDoce]: pingoDoceScraper,
}

export function getScraper(originId: number): StoreScraper {
  const scraper = scraperMap[originId]
  if (!scraper) {
    throw new Error(`Unknown origin id: ${originId}`)
  }
  return scraper
}

export { StoreOrigin }
