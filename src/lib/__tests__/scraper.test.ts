import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fs from "fs"
import * as path from "path"
import * as scraper from "@/lib/scrapers"
import { fileURLToPath } from "url"
import type { ScrapedProduct } from "@/lib/scrapers/types"

// ============================================================================
// Mocks - Must be before imports (mock axios to intercept HTTP calls)
// ============================================================================

const mockAxiosGet = vi.hoisted(() => vi.fn())

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>()
  return {
    ...actual,
    default: {
      ...actual.default,
      create: () => ({
        get: mockAxiosGet,
      }),
      isAxiosError: actual.default.isAxiosError,
    },
  }
})

// Import the scraper module AFTER mocking

// ============================================================================
// Test Fixtures
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, "fixtures")

const loadFixture = (filename: string): string => {
  return fs.readFileSync(path.join(fixturesDir, filename), "utf-8")
}

// ============================================================================
// Helper Functions Tests
// ============================================================================

describe("cleanUrl", () => {
  it("should strip tracking parameters from URLs", () => {
    const dirtyUrl = "https://www.continente.pt/produto/test-7800885.html?_gl=abc123&_ga=xyz789&utm_source=google"
    const cleanedUrl = scraper.cleanUrl(dirtyUrl)

    expect(cleanedUrl).toBe("https://www.continente.pt/produto/test-7800885.html")
    expect(cleanedUrl).not.toContain("_gl")
    expect(cleanedUrl).not.toContain("_ga")
    expect(cleanedUrl).not.toContain("utm_source")
  })

  it("should preserve non-tracking parameters", () => {
    const url = "https://www.continente.pt/produto/test.html?start=20&category=food"
    const cleanedUrl = scraper.cleanUrl(url)

    expect(cleanedUrl).toContain("start=20")
    expect(cleanedUrl).toContain("category=food")
  })

  it("should handle URLs without parameters", () => {
    const url = "https://www.continente.pt/produto/test-7800885.html"
    const cleanedUrl = scraper.cleanUrl(url)

    expect(cleanedUrl).toBe(url)
  })

  it("should handle invalid URLs gracefully", () => {
    const invalidUrl = "not-a-valid-url"
    const result = scraper.cleanUrl(invalidUrl)

    expect(result).toBe(invalidUrl)
  })

  it("should strip Facebook click ID", () => {
    const url = "https://example.com/product?fbclid=abc123&other=value"
    const cleanedUrl = scraper.cleanUrl(url)

    expect(cleanedUrl).not.toContain("fbclid")
    expect(cleanedUrl).toContain("other=value")
  })

  it("should strip Google click ID", () => {
    const url = "https://example.com/product?gclid=abc123"
    const cleanedUrl = scraper.cleanUrl(url)

    expect(cleanedUrl).not.toContain("gclid")
  })
})

// ============================================================================
// fetchHtml Tests (404 Detection)
// ============================================================================

describe("fetchHtml", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("should return success status with HTML on successful fetch", async () => {
    mockAxiosGet.mockResolvedValue({ data: "<html><body>Test</body></html>" })

    const result = await scraper.fetchHtml("https://example.com/product")

    expect(result.status).toBe("success")
    expect(result.html).toBe("<html><body>Test</body></html>")
  })

  it("should return not_found status on 404 response", async () => {
    const axios404Error = new Error("Request failed with status code 404") as any
    axios404Error.response = { status: 404 }
    axios404Error.isAxiosError = true
    mockAxiosGet.mockRejectedValue(axios404Error)

    // We need to mock isAxiosError too
    const axiosModule = await import("axios")
    vi.spyOn(axiosModule.default, "isAxiosError").mockReturnValue(true)

    const result = await scraper.fetchHtml("https://example.com/missing-product")

    expect(result.status).toBe("not_found")
    expect(result.html).toBeNull()
  })

  it("should return error status on network failure", async () => {
    const networkError = new Error("Network Error") as any
    networkError.code = "ECONNREFUSED"
    mockAxiosGet.mockRejectedValue(networkError)

    const result = await scraper.fetchHtml("https://example.com/product")

    expect(result.status).toBe("error")
    expect(result.html).toBeNull()
  })

  it("should return error status on timeout", async () => {
    const timeoutError = new Error("timeout") as any
    timeoutError.code = "ECONNABORTED"
    timeoutError.isAxiosError = true
    mockAxiosGet.mockRejectedValue(timeoutError)

    const axiosModule = await import("axios")
    vi.spyOn(axiosModule.default, "isAxiosError").mockReturnValue(true)

    const result = await scraper.fetchHtml("https://example.com/product")

    expect(result.status).toBe("error")
    expect(result.html).toBeNull()
  })

  it("should return error status on 500 server error", async () => {
    const serverError = new Error("Internal Server Error") as any
    serverError.response = { status: 500 }
    serverError.isAxiosError = true
    mockAxiosGet.mockRejectedValue(serverError)

    const axiosModule = await import("axios")
    vi.spyOn(axiosModule.default, "isAxiosError").mockReturnValue(true)

    const result = await scraper.fetchHtml("https://example.com/product")

    expect(result.status).toBe("error")
    expect(result.html).toBeNull()
  })

  it("should return error status on empty response", async () => {
    mockAxiosGet.mockResolvedValue({ data: null })

    const result = await scraper.fetchHtml("https://example.com/product")

    expect(result.status).toBe("error")
    expect(result.html).toBeNull()
  })

  it("should return error status for empty URL", async () => {
    const result = await scraper.fetchHtml("")

    expect(result.status).toBe("error")
    expect(result.html).toBeNull()
  })
})

describe("isValidProduct", () => {
  it("should return true for valid product objects", () => {
    const validProduct = {
      url: "https://example.com/product",
      name: "Test Product",
      price: 9.99,
    }

    expect(scraper.isValidProduct(validProduct)).toBe(true)
  })

  it("should return false for null", () => {
    expect(scraper.isValidProduct(null)).toBe(false)
  })

  it("should return false for undefined", () => {
    expect(scraper.isValidProduct(undefined)).toBe(false)
  })

  it("should return false for objects without url", () => {
    const invalidProduct = { name: "Test", price: 9.99 }
    expect(scraper.isValidProduct(invalidProduct)).toBe(false)
  })

  it("should return false for objects with non-string url", () => {
    const invalidProduct = { url: 123, name: "Test" }
    expect(scraper.isValidProduct(invalidProduct)).toBe(false)
  })

  it("should return false for empty objects", () => {
    expect(scraper.isValidProduct({})).toBe(false)
  })
})

describe("batchUrls", () => {
  it("should split URLs into batches of specified size", () => {
    const urls = ["url1", "url2", "url3", "url4", "url5"]
    const batches = scraper.batchUrls(urls, 2)

    expect(batches).toHaveLength(3)
    expect(batches[0]).toEqual(["url1", "url2"])
    expect(batches[1]).toEqual(["url3", "url4"])
    expect(batches[2]).toEqual(["url5"])
  })

  it("should handle empty arrays", () => {
    const batches = scraper.batchUrls([], 5)
    expect(batches).toHaveLength(0)
  })

  it("should handle batch size larger than array", () => {
    const urls = ["url1", "url2"]
    const batches = scraper.batchUrls(urls, 10)

    expect(batches).toHaveLength(1)
    expect(batches[0]).toEqual(["url1", "url2"])
  })
})

// ============================================================================
// Scraper Integration Tests (with fixtures)
// ============================================================================

describe("Continente Scraper", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("should extract product data from Continente HTML", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.continente.productPage(
      "https://www.continente.pt/produto/gelado-framboesa-e-pistacio-vegan-swee-8068467.html",
    )

    expect(result).toBeDefined()
    expect(result).not.toBeNull()

    // Check extracted values from real HTML fixture
    const product = result as ScrapedProduct
    expect(product.name).toBe("Gelado Framboesa e Pistácio Vegan")
    expect(product.brand).toBe("Swee")
    expect(product.price).toBe(6.79)
    expect(product.origin_id).toBe(1)
    expect(product.category).toBe("Congelados")
    expect(product.category_2).toBe("Gelados")
    expect(product.category_3).toBe("Gelados Americanos")
  })

  it("should handle product without discount (price equals recommended)", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.continente.productPage("https://www.continente.pt/produto/test.html")
    const product = result as ScrapedProduct

    // This product has no discount (price_recommended equals price)
    expect(product.discount).toBe(0)
  })

  it("should clean URL tracking parameters", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.continente.productPage(
      "https://www.continente.pt/produto/test.html?_gl=abc123&_ga=xyz",
    )
    const product = result as ScrapedProduct

    expect(product.url).not.toContain("_gl")
    expect(product.url).not.toContain("_ga")
  })

  it("should return empty object on fetch failure (legacy compatibility)", async () => {
    mockAxiosGet.mockResolvedValue({ data: null })

    const result = await scraper.Scrapers.continente.productPage("https://www.continente.pt/produto/test.html")

    expect(result).toEqual({})
  })

  it("should extract image URL", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.continente.productPage("https://www.continente.pt/produto/test.html")
    const product = result as ScrapedProduct

    expect(product.image).toBeDefined()
    expect(product.image).toContain("continente.pt")
    // Should be resized to 500x500
    expect(product.image).toContain("sw=500")
    expect(product.image).toContain("sh=500")
  })
})

describe("Auchan Scraper", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("should extract product data from Auchan HTML", async () => {
    const fixtureHtml = loadFixture("auchan.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.auchan.productPage(
      "https://www.auchan.pt/pt/alimentacao/congelados/gelados/gelados-equilibrio/gelado-vegan-swee-framboesa-pistacio-450-ml/3801219.html",
    )

    expect(result).toBeDefined()
    expect(result).not.toBeNull()

    // Real data from fixture: GELADO VEGAN SWEE FRAMBOESA PISTACIO 450 ML
    // formatProductName converts to title case
    const product = result as ScrapedProduct
    expect(product.name.toLowerCase()).toContain("gelado vegan swee framboesa pistacio")
    expect(product.brand).toContain("Swee")
    expect(product.price).toBe(4.99)
    expect(product.origin_id).toBe(2)
    expect(product.category).toBe("Alimentação")
    expect(product.category_2).toBe("Congelados")
    expect(product.category_3).toBe("Gelados")
  })

  it("should extract price per unit", async () => {
    const fixtureHtml = loadFixture("auchan.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.auchan.productPage("https://www.auchan.pt/pt/alimentacao/test.html")
    const product = result as ScrapedProduct

    // Verify price_per_major_unit field exists
    expect(product).toHaveProperty("price_per_major_unit")
  })

  it("should return empty object on missing JSON-LD (legacy compatibility)", async () => {
    mockAxiosGet.mockResolvedValue({ data: "<html><body>No data</body></html>" })

    const result = await scraper.Scrapers.auchan.productPage("https://www.auchan.pt/pt/test.html")

    expect(result).toEqual({})
  })
})

describe("Pingo Doce Scraper", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("should extract product data from Pingo Doce HTML", async () => {
    const fixtureHtml = loadFixture("pingodoce.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.pingoDoce.productPage(
      "https://www.pingodoce.pt/home/produtos/congelados/gelados-e-sobremesas/gelados-americanos/gelado-vegan-berries-e-pistachio-swee-985760.html",
    )

    expect(result).toBeDefined()
    expect(result).not.toBeNull()

    // Real data from fixture: Gelado Vegan Berries e Pistachio SWEE
    const product = result as ScrapedProduct
    expect(product.name).toBe("Gelado Vegan Berries e Pistachio")
    expect(product.brand).toBe("Swee")
    expect(product.price).toBe(4.99)
    expect(product.origin_id).toBe(3)
  })

  it("should extract categories from URL", async () => {
    const fixtureHtml = loadFixture("pingodoce.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.pingoDoce.productPage(
      "https://www.pingodoce.pt/produtos/congelados/gelados-e-sobremesas/gelados-americanos/gelado-vegan-985760",
    )
    const product = result as ScrapedProduct

    expect(product.category).toBe("Congelados")
    expect(product.category_2).toBe("Gelados E Sobremesas")
  })

  it("should extract price per major unit when available", async () => {
    const fixtureHtml = loadFixture("pingodoce.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.pingoDoce.productPage("https://www.pingodoce.pt/produtos/test")
    const product = result as ScrapedProduct

    // This product has price per unit info
    expect(product.price_per_major_unit).toBeDefined()
  })

  it("should handle products without discount", async () => {
    const fixtureHtml = loadFixture("pingodoce.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.pingoDoce.productPage("https://www.pingodoce.pt/produtos/test")
    const product = result as ScrapedProduct

    // This product may or may not have a discount - just verify the field exists
    expect(product).toHaveProperty("discount")
    expect(typeof product.discount).toBe("number")
  })
})

// ============================================================================
// Scraper ScrapeResult Tests (404/Availability)
// ============================================================================

describe("Scraper ScrapeResult", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("should return success type with product on successful scrape", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const scraperObj = scraper.getScraper(1)
    const result = await scraperObj.scrape({ url: "https://www.continente.pt/produto/test.html" })

    expect(result.type).toBe("success")
    expect(result.product).not.toBeNull()
    expect(result.product!.available).toBe(true)
  })

  it("should return not_found type on 404 response", async () => {
    const axios404Error = new Error("Request failed with status code 404") as any
    axios404Error.response = { status: 404 }
    axios404Error.isAxiosError = true
    mockAxiosGet.mockRejectedValue(axios404Error)

    const axiosModule = await import("axios")
    vi.spyOn(axiosModule.default, "isAxiosError").mockReturnValue(true)

    const scraperObj = scraper.getScraper(1)
    const result = await scraperObj.scrape({ url: "https://www.continente.pt/produto/missing.html" })

    expect(result.type).toBe("not_found")
    expect(result.product).toBeNull()
  })

  it("should return error type on network failure (not 404)", async () => {
    const networkError = new Error("Network Error") as any
    networkError.code = "ECONNREFUSED"
    mockAxiosGet.mockRejectedValue(networkError)

    const scraperObj = scraper.getScraper(1)
    const result = await scraperObj.scrape({ url: "https://www.continente.pt/produto/test.html" })

    expect(result.type).toBe("error")
    expect(result.product).toBeNull()
  })

  it("should return error type on empty HTML response", async () => {
    mockAxiosGet.mockResolvedValue({ data: null })

    const scraperObj = scraper.getScraper(1)
    const result = await scraperObj.scrape({ url: "https://www.continente.pt/produto/test.html" })

    expect(result.type).toBe("error")
    expect(result.product).toBeNull()
  })

  it("should return not_found type when product data cannot be extracted (soft 404)", async () => {
    // HTML that doesn't contain product data - treated as "not found" since the page exists but has no product
    mockAxiosGet.mockResolvedValue({ data: "<html><body>No product here</body></html>" })

    const scraperObj = scraper.getScraper(1)
    const result = await scraperObj.scrape({ url: "https://www.continente.pt/produto/test.html" })

    expect(result.type).toBe("not_found")
    expect(result.product).toBeNull()
  })
})

describe("Scraper available field", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("Continente scraper should set available=true on success", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const scraperObj = scraper.getScraper(1)
    const result = await scraperObj.scrape({ url: "https://www.continente.pt/produto/test.html" })

    expect(result.type).toBe("success")
    expect(result.product!.available).toBe(true)
  })

  it("Auchan scraper should set available=true on success", async () => {
    const fixtureHtml = loadFixture("auchan.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const scraperObj = scraper.getScraper(2)
    const result = await scraperObj.scrape({ url: "https://www.auchan.pt/pt/test.html" })

    expect(result.type).toBe("success")
    expect(result.product!.available).toBe(true)
  })

  it("Pingo Doce scraper should set available=true on success", async () => {
    const fixtureHtml = loadFixture("pingodoce.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const scraperObj = scraper.getScraper(3)
    const result = await scraperObj.scrape({ url: "https://www.pingodoce.pt/produtos/test" })

    expect(result.type).toBe("success")
    expect(result.product!.available).toBe(true)
  })
})

// ============================================================================
// getScraper Tests
// ============================================================================

describe("getScraper", () => {
  it("should return Continente scraper for origin 1", () => {
    const scraperObj = scraper.getScraper(1)
    expect(scraperObj.originId).toBe(1)
    expect(scraperObj.name).toBe("Continente")
  })

  it("should return Auchan scraper for origin 2", () => {
    const scraperObj = scraper.getScraper(2)
    expect(scraperObj.originId).toBe(2)
    expect(scraperObj.name).toBe("Auchan")
  })

  it("should return Pingo Doce scraper for origin 3", () => {
    const scraperObj = scraper.getScraper(3)
    expect(scraperObj.originId).toBe(3)
    expect(scraperObj.name).toBe("PingoDoce")
  })

  it("should throw for unknown origin", () => {
    expect(() => scraper.getScraper(999)).toThrow("Unknown origin id: 999")
  })
})

// ============================================================================
// Output Schema Validation
// ============================================================================

describe("Output Schema Consistency", () => {
  // Note: updated_at and created_at are database-level fields set by Supabase,
  // not returned by scrapers which only extract data from HTML
  const expectedFields = [
    "url",
    "name",
    "brand",
    "barcode",
    "pack",
    "price",
    "price_recommended",
    "price_per_major_unit",
    "major_unit",
    "discount",
    "image",
    "category",
    "category_2",
    "category_3",
    "origin_id",
    "priority",
    "available",
  ]

  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("Continente scraper should return all expected fields", async () => {
    const fixtureHtml = loadFixture("continente.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.continente.productPage("https://www.continente.pt/produto/test.html")

    for (const field of expectedFields) {
      expect(result).toHaveProperty(field)
    }
  })

  it("Auchan scraper should return all expected fields", async () => {
    const fixtureHtml = loadFixture("auchan.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.auchan.productPage("https://www.auchan.pt/pt/test.html")

    for (const field of expectedFields) {
      expect(result).toHaveProperty(field)
    }
  })

  it("Pingo Doce scraper should return all expected fields", async () => {
    const fixtureHtml = loadFixture("pingodoce.html")
    mockAxiosGet.mockResolvedValue({ data: fixtureHtml })

    const result = await scraper.Scrapers.pingoDoce.productPage("https://www.pingodoce.pt/produtos/test")

    for (const field of expectedFields) {
      expect(result).toHaveProperty(field)
    }
  })
})
