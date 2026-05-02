"use client"

import { usePathname } from "next/navigation"

import { ProductBarcodeLoadingShell } from "@/components/products/ProductBarcodeLoadingShell"
import { ProductGridLoadingSkeleton } from "@/components/products/ProductGridLoadingSkeleton"
import { readLastBarcodeLookup } from "@/lib/barcode-scan-storage"

export default function ProductsSegmentLoading() {
  const pathname = usePathname() ?? ""
  const pendingCode = readLastBarcodeLookup()
  const onBarcodePath = pathname.includes("/products/barcode/")
  const showBarcodeShell = onBarcodePath || Boolean(pendingCode)

  return showBarcodeShell ? <ProductBarcodeLoadingShell /> : <ProductGridLoadingSkeleton />
}
