import { BarcodeRouteLoading } from "@/components/products/BarcodeRouteLoading"
import { HideFooter } from "@/contexts/FooterContext"

export default function BarcodeSegmentLoading() {
  return (
    <main className="flex w-full flex-col">
      <HideFooter />
      <BarcodeRouteLoading />
    </main>
  )
}
