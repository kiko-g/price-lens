import type { GtinFormat } from "@/types"

export interface ParsedGtin {
  raw: string
  normalized: string
  format: GtinFormat
  gs1Prefix: string | null
  checkDigit: number
  isValid: boolean
  /** For GTIN-14: the packaging indicator (first digit, 0-9) */
  packagingIndicator?: number
  /** For GTIN-14: the inner GTIN-13 (digits 2-14) */
  innerGtin13?: string
}

function detectFormat(digits: string): GtinFormat | null {
  switch (digits.length) {
    case 8:
      return "ean8"
    case 12:
      return "upca"
    case 13:
      return "ean13"
    case 14:
      return "gtin14"
    default:
      return null
  }
}

/**
 * GS1 standard modulo-10 check digit validation.
 * Works for EAN-8, UPC-A, EAN-13, and GTIN-14.
 */
function validateCheckDigit(digits: string): boolean {
  const nums = digits.split("").map(Number)
  const withoutCheck = nums.slice(0, -1)
  const actualCheck = nums[nums.length - 1]

  let sum = 0
  for (let i = withoutCheck.length - 1; i >= 0; i--) {
    const positionFromRight = withoutCheck.length - i
    sum += withoutCheck[i] * (positionFromRight % 2 === 1 ? 3 : 1)
  }

  const expectedCheck = (10 - (sum % 10)) % 10
  return actualCheck === expectedCheck
}

/**
 * Parse a barcode string into structured GTIN data.
 * Returns null if the input is not a valid barcode format.
 */
export function parseGtin(barcode: string): ParsedGtin | null {
  const digits = barcode.replace(/\s/g, "").trim()

  if (!/^\d+$/.test(digits)) return null

  const format = detectFormat(digits)
  if (!format) return null

  const isValid = validateCheckDigit(digits)
  const checkDigit = Number(digits[digits.length - 1])

  let gs1Prefix: string | null = null
  if (format === "ean13" || format === "gtin14") {
    gs1Prefix = format === "gtin14" ? digits.substring(1, 4) : digits.substring(0, 3)
  }

  const result: ParsedGtin = { raw: barcode, normalized: digits, format, gs1Prefix, checkDigit, isValid }

  if (format === "gtin14") {
    result.packagingIndicator = Number(digits[0])
    result.innerGtin13 = digits.substring(1)
  }

  return result
}

/**
 * If the barcode is a GTIN-14 with packaging indicator 0,
 * returns the inner GTIN-13 (which IS the consumer-unit barcode).
 * Otherwise returns null.
 */
export function extractInnerGtin13(barcode: string): string | null {
  const parsed = parseGtin(barcode)
  if (!parsed || parsed.format !== "gtin14") return null
  if (parsed.packagingIndicator === 0 && parsed.innerGtin13) {
    return parsed.innerGtin13
  }
  return null
}
