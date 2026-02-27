/**
 * Run a store product scraper locally for a given URL.
 * Usage: pnpm scraper:local <store> <url>
 * Store: 1|2|3 or continente|auchan|pingodoce (case-insensitive)
 */
import { getScraper, StoreOrigin } from "@/lib/scrapers/get-scraper"

const NAME_TO_ID: Record<string, number> = {
  continente: StoreOrigin.Continente,
  auchan: StoreOrigin.Auchan,
  pingodoce: StoreOrigin.PingoDoce,
}

function parseStoreArg(arg: string): number | null {
  const id = Number(arg)
  if (Number.isInteger(id) && id >= 1 && id <= 3) return id
  const name = arg.toLowerCase().replace(/\s+/g, "")
  return NAME_TO_ID[name] ?? null
}

async function main() {
  const [, , storeArg, url] = process.argv

  if (!storeArg || !url) {
    console.error("Usage: pnpm scraper:local <store> <url>")
    console.error("  store: 1|2|3 or continente|auchan|pingodoce")
    process.exit(1)
  }

  const originId = parseStoreArg(storeArg)
  if (originId === null) {
    console.error(`Unknown store: ${storeArg}. Use 1-3 or continente|auchan|pingodoce`)
    process.exit(1)
  }

  const scraper = getScraper(originId)
  const result = await scraper.scrape({ url })

  console.log(JSON.stringify({ type: result.type, product: result.product }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
