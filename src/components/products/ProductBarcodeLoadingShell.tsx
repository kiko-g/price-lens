import { BarcodeRouteLoading } from "@/components/products/BarcodeRouteLoading"
import { HideFooter } from "@/contexts/FooterContext"

export function ProductBarcodeLoadingShell() {
  return (
    <main className="flex w-full flex-col">
      <HideFooter />
      <BarcodeRouteLoading />
    </main>
  )
}
