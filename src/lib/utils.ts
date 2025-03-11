import type { Price, ProductChartEntry, SupermarketProduct } from "@/types"
import type { DateRange } from "@/types/extra"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const existingCategories = [
  "Mercearia",
  "Congelados",
  "Bebidas e Garrafeira",
  "Frescos",
  "Beleza e Higiene",
  "Bio, Eco e Saudável",
  "Bebé",
  "Limpeza",
  "Laticínios e Ovos",
  "Animais",
  "Brinquedos e Jogos",
  "Campanhas",
  "Casa, Bricolage e Jardim",
  "Cão",
  "Charcutaria e Queijos",
  "Continente Navigation Catalog",
  "Desporto e Malas de Viagem",
  "Destaques",
  "Folhetos Pesquisa",
  "Gato",
  "Livraria e Papelaria",
  "Marcas",
  "Negócios",
  "Presentes",
  "Resultado de Pesquisa",
]
export const defaultCategories = []

export const existingCategories2 = [
  "1 a 2 Anos",
  "Acessórios e Brinquedos",
  "Alimentação, Leites e Acessórios",
  "Ambientadores",
  "Aquecimento e Desumidificadores",
  "Bazarão",
  "Bebidas Espirituosas",
  "Bebidas Vegetais",
  "Biológicos",
  "Bolachas, Biscoitos e Tostas",
  "Bonecas",
  "Brinquedos e Livros",
  "Bricolage",
  "Cadeiras Auto",
  "Cabelo",
  "Campanhas Folhetos",
  "Cereais e Barras",
  "Cervejas e Sidras",
  "Clube de Produtores Continente",
  "Colecionáveis",
  "Conservas",
  "Corpo",
  "Cupões EntregaZero",
  "Didáticos e Plasticinas",
  "Escolhas + Sustentáveis",
  "Euro 2024",
  "Faz de Conta",
  "Feira Auto",
  "Feira de Iluminação e Tecnologia",
  "Feira de Vinhos, Enchidos e Queijos",
  "Feira Produtos Continente",
  "Feira Vida Saudável",
  "Feiras e Campanhas",
  "Festa",
  "Fim de Ano",
  "Fim de Semana dos Brinquedos",
  "Frutas",
  "Frutas e Legumes",
  "Garrafeira",
  "Garrafeira Exclusiva Online",
  "Gato",
  "Guardanapos, Rolos e Películas",
  "Higiene Íntima",
  "Higiene Oral",
  "Inseticidas",
  "Iogurtes",
  "IVA Zero",
  "Jardinagem e Plantas",
  "Lavandaria, Arrumação e Banho",
  "Lenços e Cuidados de Saúde",
  "Licores e Aperitivos",
  "Limpeza Casa de Banho",
  "Limpeza da Cozinha",
  "Limpeza da Roupa e Calçado",
  "Limpeza Geral",
  "Livros",
  "Maquilhagem",
  "Manteigas e Cremes para Barrar",
  "Marcas Continente",
  "Maternidade e Amamentação",
  "Mês Online",
  "Modalidades Desportivas",
  "Molhos, Temperos e Sal",
  "Natas e Bechamel",
  "Outros Animais",
  "Padaria e Pastelaria",
  "Papel Higiénico",
  "Papelaria",
  "Peixaria",
  "Peixe, Marisco e Carne",
  "Piscinas",
  "Pré-escolar",
  "Produtos de Papel",
  "Proteção e Conforto",
  "Puzzles",
  "Quarto e Colchões",
  "Quarto de Bebé",
  "Regresso às Aulas",
  "Rosto",
  "Roupa de Desporto",
  "Sacos e Baldes do Lixo",
  "Saldos",
  "Sem Glúten",
  "Smart Home e Eletrodomésticos",
  "Snacks e Biscoitos",
  "Sobremesas",
  "Sumos e Refrigerantes",
  "Take Away",
  "Todos",
  "Tudo para o Churrasco",
  "Tudo para o Escritório",
  "Tudo para o seu Natal",
  "Vegan",
  "Vegetariano e Vegan",
  "Vida Saudável",
  "Vinhos",
  "Viral Beauty",
  "ZU",
]
export const defaultCategories2 = []

export const existingCategories3 = [
  "1 a 2 Anos",
  "Absorventes", // Gatos
  "Acessórios Interior",
  "Acessórios para Bolos",
  "Alface, Tomate, Pepino e Pimento",
  "Alheira e Farinheira",
  "Antirrugas e Refirmantes",
  "Arroz",
  "Arrumação e Mudança",
  "Bacon e Fumados",
  "Banheiras e Assentos",
  "Batata, Batata Doce e Mandioca",
  "Bebida Amêndoa",
  "Bicicletas de Criança",
  "Boiões, Saquetas e Puré de Fruta",
  "Bolos Congelados",
  "Bombons",
  "Brinquedos e Arranhadores",
  "Café em Cápsulas",
  "Café Torrado",
  "Capacetes, Proteções e Acessórios",
  "Casa, Jardim, Brico e Auto",
  "Cestos e Caixas Decorativos",
  "Champanhe",
  "Cogumelos, Espargos e Exóticos",
  "Controlo de Peso e Drenantes",
  "Corn Flakes",
  "Cremes Vegetais e Margarinas",
  "Especiarias e Ervas Aromáticas",
  "Faqueiros e Talheres",
  "Fatiados e Cremes Vegetais",
  "Figuras e Cenários de Ação",
  "Fraldas <2kg/2-5kg/3-6kg (T0, T1 e T2)",
  "Frango e Peru",
  "Frutas",
  "Frutas da Época",
  "Ganchos de Parede e Feltros",
  "Gomas, Pastilhas e Rebuçados",
  "Grelhadores e Barbecues",
  "Grelhados Perfeitos",
  "I-Size 125-150cm",
  "Iogurtes Gregos",
  "Iogurtes Infantis",
  "Jóias e Cosmética",
  "Lábios",
  "Laticínios e Ovos",
  "Lençóis",
  "Liquidificadoras, Batedeiras e Varinhas",
  "Lixívias",
  "Malas de Viagem Médias",
  "Mantas",
  "Maquilhagem para Oferecer",
  "Marca da Semana Purina",
  "Manteigas",
  "Marisco",
  "Máscaras",
  "Molho Bechamel",
  "Mobiliário",
  "Motos",
  "Natas Culinárias",
  "Nutricosmética",
  "Nuggets e Panados",
  "Organizadores Roupa e Sacos Vácuo",
  "Os Favoritos de Criança",
  "Outras Bebidas Vegetais",
  "Outros Inseticidas",
  "Padaria e Pastelaria",
  "Papel Higiénico 2 Folhas",
  "Pensos Diários",
  "Peixe Congelado",
  "Polvo, Lulas e Chocos",
  "Pratos, Copos e Termos",
  "Pré-escolar",
  "Preparados de Sopas",
  "Produtos Continente Lacticínios",
  "Puzzles 3D e 4D",
  "Ralado",
  "Resguardos, Fraldas e Toalhitas",
  "Roedores",
  "Rum",
  "Sangrias e Aromatizados",
  "Sardinha, Cavala, Lulas",
  "Saquetas e Purés de Fruta",
  "Sementes",
  "Smart Home",
  "Snacks e Barrar",
  "Snacks, Leites & Biscoitos",
  "Tábuas e Ferros de Engomar",
  "Tapetes, Passadeiras e Capachos",
  "Tequila",
  "Todos",
  "Torradeiras e Sandwicheiras",
  "Velas",
  "Vinhos Douro Verdes Dão Beira Interior e Bairrada",
  "Young Adult",
]
export const defaultCategories3 = [
  "1 a 2 Anos",
  "Alface, Tomate, Pepino e Pimento",
  "Alheira e Farinheira",
  "Arroz",
  "Bacon e Fumados",
  "Batata, Batata Doce e Mandioca",
  "Bebida Amêndoa",
  "Café em Cápsulas",
  "Café Torrado",
  "Cogumelos, Espargos e Exóticos",
  "Corn Flakes",
  "Cremes Vegetais e Margarinas",
  // "Especiarias e Ervas Aromáticas",
  "Fraldas <2kg/2-5kg/3-6kg (T0, T1 e T2)",
  "Frango e Peru",
  "Frutas",
  "Frutas da Época",
  "Gomas, Pastilhas e Rebuçados",
  "Iogurtes Gregos",
  "Iogurtes Infantis",
  "Laticínios e Ovos",
  "Lixívias",
  "Manteigas",
  "Marisco",
  // "Molho Bechamel",
  // "Natas Culinárias",
  "Nuggets e Panados",
  // "Os Favoritos de Criança",
  // "Outras Bebidas Vegetais",
  "Padaria e Pastelaria",
  "Papel Higiénico 2 Folhas",
  "Pensos Diários",
  "Peixe Congelado",
  "Polvo, Lulas e Chocos",
  "Produtos Continente Lacticínios",
  "Sangrias e Aromatizados",
  "Sardinha, Cavala, Lulas",
  "Saquetas e Purés de Fruta",
  "Sementes",
  "Snacks e Barrar",
  "Snacks, Leites & Biscoitos",
]

export const imagePlaceholder = {
  productBlur:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEwPDY2ODYyTEhHSkhGSUxQWlNgYFtVWV1KV2JhboN8f5rCxrL/2wBDARUXFyAeIBogHB4iIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
}

export const mockChartData: ProductChartEntry[] = [
  { date: "January", price: 4.99, "price-recommended": 5.99, discount: 17, "price-per-major-unit": 9.99 },
  { date: "February", price: 5.49, "price-recommended": 5.99, discount: 8, "price-per-major-unit": 10.98 },
  { date: "March", price: 5.99, "price-recommended": 6.49, discount: 8, "price-per-major-unit": 11.98 },
  { date: "April", price: 5.49, "price-recommended": 6.49, discount: 15, "price-per-major-unit": 10.98 },
  { date: "May", price: 4.99, "price-recommended": 6.49, discount: 23, "price-per-major-unit": 9.99 },
  { date: "June", price: 5.99, "price-recommended": 6.99, discount: 14, "price-per-major-unit": 11.98 },
  { date: "July", price: 6.49, "price-recommended": 6.99, discount: 7, "price-per-major-unit": 12.98 },
  { date: "August", price: 5.99, "price-recommended": 6.99, discount: 14, "price-per-major-unit": 11.98 },
  { date: "September", price: 5.49, "price-recommended": 6.49, discount: 15, "price-per-major-unit": 10.98 },
  { date: "October", price: 4.99, "price-recommended": 6.49, discount: 23, "price-per-major-unit": 9.99 },
  { date: "November", price: 5.99, "price-recommended": 6.99, discount: 14, "price-per-major-unit": 11.98 },
  { date: "December", price: 6.49, "price-recommended": 6.99, discount: 7, "price-per-major-unit": 16.0 },
]

export const productUnavailable: SupermarketProduct = {
  url: "",
  name: "Unavailable",
  brand: "",
  pack: "",
  price: 0,
  price_recommended: 0,
  price_per_major_unit: 0,
  major_unit: "",
  discount: 0,
  image: "",
  category: "",
  category_2: "",
  category_3: "",
  created_at: null,
  updated_at: null,
  origin_id: 1,
  is_tracked: false,
}

export function resizeImgSrc(src: string, width: number, height: number) {
  if (!src) return ""

  const updatedSrc = src.replace(/sw=\d+/g, `sw=${width}`).replace(/sh=\d+/g, `sh=${height}`)
  return updatedSrc
}

export function packageToUnit(pack: string) {
  return pack.replace("emb.", "").replace(/\s+/g, " ").trim()
}

export function priceToNumber(price: string) {
  if (typeof price === "number") return price
  return Number(price.replace(",", ".").replace(/[^0-9.-]+/g, "")) // assuming PT locale
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(price)
}

export function formatTimestamptz(timestamptz: string | null) {
  if (!timestamptz) return ""

  return new Date(timestamptz).toLocaleString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function discountValueToPercentage(discount: number) {
  return `${(Math.round(discount * 1000) / 10).toFixed(1)}%`
}

export function isValidJson(json: string) {
  try {
    JSON.parse(json)
    return true
  } catch (error) {
    return false
  }
}

export function getCenteredArray(length: number, page: number, rightmostBoundary: number | null = null) {
  const halfLength = Math.floor(length / 2)
  let start = Math.max(1, page - halfLength)

  if (page <= halfLength) {
    start = 1 // near the start
  }

  if (rightmostBoundary && start + length > rightmostBoundary) {
    start = Math.max(1, rightmostBoundary - length + 1) // near the end
  }

  const array = Array.from({ length }, (_, i) => start + i)
  return array
}

export function now() {
  return new Date().toISOString().replace("Z", "+00:00")
}

export function buildChartData(prices: Price[], range: DateRange = "1M"): ProductChartEntry[] {
  // Helper to parse date strings into UTC dates at midnight
  const parseUTCDate = (dateStr: string): Date => {
    const date = new Date(dateStr)
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  // Filter out prices without valid_from and sort them by valid_from
  const validPrices = prices.filter((p) => p.valid_from !== null)
  if (validPrices.length === 0) {
    return []
  }
  validPrices.sort((a, b) => a.valid_from!.localeCompare(b.valid_from!))

  // Preprocess prices into objects with UTC Date instances
  type ProcessedPrice = {
    validFrom: Date
    validTo: Date | null
    price: number | null
    price_recommended: number | null
    price_per_major_unit: number | null
    discount: number | null
  }

  const processedPrices: ProcessedPrice[] = validPrices.map((p) => {
    const validFrom = parseUTCDate(p.valid_from!)
    const validTo = p.valid_to ? parseUTCDate(p.valid_to) : null
    return {
      validFrom,
      validTo,
      price: p.price,
      price_recommended: p.price_recommended,
      price_per_major_unit: p.price_per_major_unit,
      discount: p.discount,
    }
  })

  // Adjust validTo dates to avoid overlaps and gaps (using UTC)
  for (let i = 0; i < processedPrices.length - 1; i++) {
    const current = processedPrices[i]
    const next = processedPrices[i + 1]
    const adjustedValidTo = new Date(next.validFrom)
    adjustedValidTo.setUTCDate(adjustedValidTo.getUTCDate() - 1) // Previous day in UTC

    if (current.validTo === null || current.validTo > adjustedValidTo) {
      current.validTo = adjustedValidTo
    }
  }

  // Determine start and end dates based on the range (UTC)
  const getStartEndDates = (range: DateRange): { start: Date; end: Date } => {
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    if (range === "Max") {
      const earliest = processedPrices[0].validFrom
      const latestPrice = processedPrices[processedPrices.length - 1]
      const endDate = latestPrice.validTo || todayUTC
      return { start: earliest, end: endDate }
    } else {
      const endDate = todayUTC
      const startDate = new Date(endDate)

      switch (range) {
        case "1W":
          startDate.setUTCDate(endDate.getUTCDate() - 7)
          break
        case "1M":
          startDate.setUTCMonth(endDate.getUTCMonth() - 1)
          break
        case "3M":
          startDate.setUTCMonth(endDate.getUTCMonth() - 3)
          break
        case "6M":
          startDate.setUTCMonth(endDate.getUTCMonth() - 6)
          break
        case "1Y":
          startDate.setUTCFullYear(endDate.getUTCFullYear() - 1)
          break
        case "5Y":
          startDate.setUTCFullYear(endDate.getUTCFullYear() - 5)
          break
        default:
          throw new Error(`Unsupported range: ${range}`)
      }
      return { start: startDate, end: endDate }
    }
  }

  const { start, end } = getStartEndDates(range)

  // Generate all UTC dates from start to end, inclusive at midnight UTC
  const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = []
    const current = new Date(startDate)
    current.setUTCHours(0, 0, 0, 0)
    const endUTC = new Date(endDate)
    endUTC.setUTCHours(0, 0, 0, 0)

    while (current <= endUTC) {
      dates.push(new Date(current))
      current.setUTCDate(current.getUTCDate() + 1)
    }
    return dates
  }

  const dates = generateDateRange(start, end)
  const daysBetweenDates = getDaysBetweenDates(start, end)

  const entries: ProductChartEntry[] = []
  let currentPriceIndex = 0

  for (const date of dates) {
    const dateStr = formatDate(date.toISOString(), daysBetweenDates > 30 ? range : "1M")

    while (currentPriceIndex < processedPrices.length) {
      const price = processedPrices[currentPriceIndex]
      if (date < price.validFrom) {
        break
      }

      if (price.validTo !== null && date > price.validTo) {
        currentPriceIndex++
      } else {
        entries.push({
          date: dateStr,
          price: price.price ?? 0,
          "price-per-major-unit": price.price_per_major_unit ?? 0,
          "price-recommended": price.price_recommended ?? 0,
          discount: price.discount ? price.discount * 100 : 0,
        })
        break
      }
    }
  }

  return entries
}

function formatDate(dateString: string, range: DateRange = "1M"): string {
  const date = new Date(dateString)

  switch (range) {
    case "3M":
    case "6M":
    case "1Y":
    case "5Y":
    case "Max":
      return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })

    case "1W":
    case "1M":
    default:
      return date.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
      })
  }
}

export function getDaysBetweenDates(startDate: Date, endDate: Date) {
  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}
