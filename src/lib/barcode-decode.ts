/**
 * Robust barcode decoding: multiple strategies and image preprocessing
 * to handle blurry, low-contrast, or difficult images (e.g. shelf labels).
 * Uses: native BarcodeDetector (Chrome/Edge), Quagga2, html5-qrcode.
 */

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
} from "html5-qrcode"
import Quagga from "@ericblade/quagga2"

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
]

const ELEMENT_ID_ROBUST_DECODE = "barcode-robust-decode-root"

function isProductBarcode(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 14
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function tryHtml5Qrcode(file: File): Promise<string | null> {
  const el = document.getElementById(ELEMENT_ID_ROBUST_DECODE)
  if (!el) return null
  const scanner = new Html5Qrcode(ELEMENT_ID_ROBUST_DECODE, {
    formatsToSupport: BARCODE_FORMATS,
    verbose: false,
    useBarCodeDetectorIfSupported: true,
  })
  try {
    const result: Html5QrcodeResult = await scanner.scanFileV2(file, false)
    if (result?.decodedText && isProductBarcode(result.decodedText)) {
      return result.decodedText
    }
  } finally {
    scanner.clear()
  }
  return null
}

function ensureDecodeElement(): void {
  if (typeof document === "undefined") return
  if (document.getElementById(ELEMENT_ID_ROBUST_DECODE)) return
  const div = document.createElement("div")
  div.id = ELEMENT_ID_ROBUST_DECODE
  div.setAttribute("aria-hidden", "true")
  div.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;"
  document.body.appendChild(div)
}

async function tryBarcodeDetector(file: File): Promise<string | null> {
  const BarcodeDetector = (globalThis as unknown as { BarcodeDetector?: unknown })
    .BarcodeDetector
  if (!BarcodeDetector || typeof (BarcodeDetector as CallableFunction) !== "function") {
    return null
  }
  const detector = new (BarcodeDetector as new (opts: { formats: string[] }) => {
    detect: (src: ImageBitmapSource) => Promise<{ rawValue: string }[]>
  })({
    formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
  })
  try {
    const bitmap = await createImageBitmap(file)
    const results = await detector.detect(bitmap)
    bitmap.close()
    const first = results.find((r) => r.rawValue && isProductBarcode(r.rawValue))
    return first?.rawValue ?? null
  } catch {
    return null
  }
}

const QUAGGA_LOCATOR_VARIANTS: Array<{ patchSize?: string; halfSample?: boolean }> = [
  { patchSize: "medium", halfSample: true },
  { patchSize: "large", halfSample: true },
  { patchSize: "small", halfSample: false },
]

async function tryQuagga2(file: File): Promise<string | null> {
  let dataUrl: string
  try {
    dataUrl = await fileToDataUrl(file)
  } catch {
    return null
  }
  const baseConfig = {
    src: dataUrl,
    decoder: { readers: ["ean_reader", "upc_reader"] },
    numOfWorkers: 0,
    locate: true,
  }
  for (const locator of QUAGGA_LOCATOR_VARIANTS) {
    try {
      const result = await Quagga.decodeSingle({
        ...baseConfig,
        locator: { ...locator, willReadFrequently: false },
      } as Parameters<typeof Quagga.decodeSingle>[0])
      const code = result?.codeResult?.code
      if (code && isProductBarcode(code)) return code
    } catch {
      // try next locator
    }
  }
  return null
}

export interface PreprocessOptions {
  contrast?: number
  brightness?: number
  grayscale?: boolean
  scale?: number
}

function preprocessImage(file: File, options: PreprocessOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      const scale = options.scale ?? 1
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("No canvas context"))
        return
      }
      const filters: string[] = []
      if (options.contrast != null) filters.push(`contrast(${options.contrast})`)
      if (options.brightness != null) filters.push(`brightness(${options.brightness})`)
      if (options.grayscale) filters.push("grayscale(1)")
      if (filters.length) ctx.filter = filters.join(" ")
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("toBlob failed"))
            return
          }
          resolve(
            new File([blob], file.name, { type: blob.type, lastModified: Date.now() }),
          )
        },
        "image/jpeg",
        0.92,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image load failed"))
    }
    img.src = url
  })
}

const PREPROCESS_VARIANTS: PreprocessOptions[] = [
  {},
  { contrast: 1.35, brightness: 1.05 },
  { contrast: 1.5, brightness: 1.1 },
  { grayscale: true, contrast: 1.4, brightness: 1.05 },
  { contrast: 1.2, brightness: 1.1, scale: 2 },
  { contrast: 1.5, brightness: 1.05, scale: 1.5 },
]

/**
 * Decode a barcode from an image file using multiple strategies:
 * 1. Native BarcodeDetector (Chrome/Edge) on original image
 * 2. Quagga2 (localization + EAN/UPC) with several locator configs
 * 3. html5-qrcode on original file
 * 4. html5-qrcode on preprocessed variants (contrast, grayscale, scale)
 */
export async function decodeBarcodeFromFile(file: File): Promise<string | null> {
  ensureDecodeElement()

  let result = await tryBarcodeDetector(file)
  if (result) return result

  result = await tryQuagga2(file)
  if (result) return result

  result = await tryHtml5Qrcode(file)
  if (result) return result

  for (const opts of PREPROCESS_VARIANTS) {
    if (Object.keys(opts).length === 0) continue
    try {
      const processed = await preprocessImage(file, opts)
      result = await tryHtml5Qrcode(processed)
      if (result) return result
    } catch {
      // skip this variant
    }
  }

  return null
}
