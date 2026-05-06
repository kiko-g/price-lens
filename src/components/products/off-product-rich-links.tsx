"use client"

import { createContext, useContext, type ReactNode } from "react"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

const BarcodeCtx = createContext<string | null>(null)

export function OffProductBarcodeProvider({ barcode, children }: { barcode: string; children: ReactNode }) {
  return <BarcodeCtx.Provider value={barcode}>{children}</BarcodeCtx.Provider>
}

export function OffPageNotTrackedRichLink(chunks: ReactNode) {
  const barcode = useContext(BarcodeCtx)
  if (barcode == null) {
    throw new Error("OffPageNotTrackedRichLink must be used within OffProductBarcodeProvider")
  }
  return (
    <a
      href={`https://world.openfoodfacts.org/product/${barcode}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
    >
      {chunks}
      <OpenFoodFactsIcon className="h-4 w-4" />
    </a>
  )
}

export function OffPageSparseDataRichLink(chunks: ReactNode) {
  const barcode = useContext(BarcodeCtx)
  if (barcode == null) {
    throw new Error("OffPageSparseDataRichLink must be used within OffProductBarcodeProvider")
  }
  return (
    <a
      href={`https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=${barcode}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {chunks}
    </a>
  )
}
