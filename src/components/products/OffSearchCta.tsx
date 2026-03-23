import Link from "next/link"

import type { OffProduct } from "@/lib/canonical/open-food-facts"

import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"

interface OffSearchCtaProps {
  product: OffProduct
}

const STOP_WORDS = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "el",
  "los",
  "las",
  "con",
  "com",
  "e",
  "et",
  "y",
  "and",
  "the",
  "a",
  "an",
  "of",
  "en",
  "em",
  "für",
  "mit",
  "und",
  "aux",
  "au",
  "dal",
  "del",
])

/**
 * Portuguese food/flavor vocabulary used to filter product name words.
 * Words found in this set are likely to match Portuguese product names
 * in the database; foreign-language words (e.g. Spanish "fresa") are skipped.
 */
const PT_FOOD_WORDS = new Set([
  // dairy
  "iogurte",
  "leite",
  "queijo",
  "manteiga",
  "nata",
  "requeijão",
  // fruits
  "morango",
  "banana",
  "laranja",
  "limão",
  "maçã",
  "pera",
  "pêssego",
  "manga",
  "ananás",
  "cereja",
  "mirtilo",
  "framboesa",
  "coco",
  "uva",
  "kiwi",
  "melão",
  "melancia",
  "ameixa",
  "figo",
  "alperce",
  "groselha",
  // flavors & ingredients
  "chocolate",
  "baunilha",
  "caramelo",
  "canela",
  "mel",
  "cacau",
  "café",
  "amendoim",
  "amêndoa",
  "avelã",
  "noz",
  "nozes",
  "pistácio",
  "sésamo",
  // grains & cereals
  "aveia",
  "centeio",
  "espelta",
  "milho",
  "trigo",
  "arroz",
  "cereais",
  "granola",
  "muesli",
  // protein
  "frango",
  "peru",
  "porco",
  "carne",
  "vitela",
  "borrego",
  "peixe",
  "atum",
  "bacalhau",
  "salmão",
  "sardinha",
  "camarão",
  "ovo",
  "ovos",
  "proteína",
  // vegetables
  "tomate",
  "cebola",
  "alho",
  "pimento",
  "pepino",
  "cenoura",
  "batata",
  "ervilha",
  "feijão",
  "grão",
  "lentilha",
  "cogumelo",
  "espinafre",
  "brócolos",
  "couve",
  "alface",
  "rúcula",
  "abóbora",
  "beringela",
  // pantry
  "azeite",
  "vinagre",
  "mostarda",
  "molho",
  "massa",
  "farinha",
  "açúcar",
  "sal",
  "pão",
  "bolacha",
  "bolachas",
  "biscoito",
  // beverages
  "água",
  "sumo",
  "cerveja",
  "vinho",
  "chá",
  // descriptors common in PT product names
  "natural",
  "magro",
  "gordo",
  "integral",
  "biológico",
  "vegetal",
  "light",
  "zero",
  "fibra",
  "puré",
  "compota",
  "gelado",
  "sopa",
])

const OFF_CATEGORY_MAP: Record<string, string> = {
  yogurts: "iogurte",
  yoghurts: "iogurte",
  milks: "leite",
  cheeses: "queijo",
  butters: "manteiga",
  breads: "pão",
  juices: "sumo",
  chocolates: "chocolate",
  cereals: "cereais",
  biscuits: "bolacha",
  cookies: "bolacha",
  pastas: "massa",
  rices: "arroz",
  coffees: "café",
  teas: "chá",
  waters: "água",
  beers: "cerveja",
  wines: "vinho",
  oils: "azeite",
  sugars: "açúcar",
  honeys: "mel",
  jams: "compota",
  soups: "sopa",
  sauces: "molho",
  chips: "batata",
  "ice creams": "gelado",
  fruits: "fruta",
  vegetables: "legume",
  meats: "carne",
  poultry: "frango",
  chicken: "frango",
  pork: "porco",
  fish: "peixe",
  tuna: "atum",
  cod: "bacalhau",
  cream: "nata",
  ham: "fiambre",
  eggs: "ovos",
  "fruit purees": "puré fruta",
  compotes: "compota fruta",
  "plant-based": "vegetal",
  snacks: "snack",
  drinks: "bebida",
}

function extractMeaningfulWords(text: string | null): string[] {
  if (!text) return []
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
}

function extractPortugueseWords(words: string[]): string[] {
  return words.filter((w) => PT_FOOD_WORDS.has(w.toLowerCase()))
}

function extractCategoryKeywords(product: OffProduct): string[] {
  const tags = product.categoriesTags
  if (!tags?.length) return []
  const keywords: string[] = []
  for (const tag of tags) {
    const clean = tag
      .replace(/^\w{2}:/, "")
      .replace(/-/g, " ")
      .toLowerCase()
    for (const [eng, pt] of Object.entries(OFF_CATEGORY_MAP)) {
      if (clean.includes(eng)) keywords.push(pt)
    }
  }
  return [...new Set(keywords)]
}

function buildSearchQueries(product: OffProduct): string[] {
  const queries: string[] = []
  const seen = new Set<string>()

  const add = (q: string) => {
    const key = q.toLowerCase()
    if (q && !seen.has(key)) {
      seen.add(key)
      queries.push(q)
    }
  }

  const catKeywords = extractCategoryKeywords(product)
  const nameWords = extractMeaningfulWords(product.productName)
  const genericWords = extractMeaningfulWords(product.genericName)
  const allDescriptive = [...genericWords, ...nameWords]

  const ptWords = extractPortugueseWords(allDescriptive)
  const descriptive = ptWords.length > 0 ? ptWords : genericWords.length > 0 ? genericWords : nameWords

  if (catKeywords.length > 0 && descriptive.length > 0) {
    add(`${catKeywords[0]} ${descriptive[0]}`)
  } else if (catKeywords.length > 0) {
    add(catKeywords[0])
  }

  if (descriptive.length > 0) {
    add(descriptive.slice(0, 2).join(" "))
  }

  if (queries.length === 0) {
    const brand = product.brands?.split(",")[0]?.trim()
    if (brand) add(brand)
  }

  return queries.slice(0, 2)
}

export function OffSearchCta({ product }: OffSearchCtaProps) {
  const queries = buildSearchQueries(product)
  if (queries.length === 0) return null

  return (
    <section className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">
        Looking for something similar? Try searching our tracked stores with similar keywords.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {queries.map((query, i) => (
          <Button key={query} asChild variant={i === 0 ? "default" : "outline"} size="sm">
            <Link href={`/products?q=${encodeURIComponent(query)}`}>
              <SearchIcon className="h-4 w-4" />
              Search &ldquo;{query}&rdquo;
            </Link>
          </Button>
        ))}
      </div>
    </section>
  )
}
