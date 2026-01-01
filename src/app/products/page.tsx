import { Suspense } from "react"
import { StoreProductsShowcase } from "@/components/StoreProductsShowcase"
import { Skeleton } from "@/components/ui/skeleton"
import { Footer } from "@/components/layout/Footer"
import { HideFooter } from "@/contexts/FooterContext"

export const metadata = {
  title: "Products | Price Lens",
  description: "Browse and compare prices across supermarkets",
}

function LoadingFallback() {
  return (
    <div className="flex w-full flex-col gap-3 p-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function StoreProductsPage() {
  return (
    <main className="h-[calc(100vh-54px)] overflow-hidden">
      <HideFooter />
      <Suspense fallback={<LoadingFallback />}>
        <StoreProductsShowcase limit={40}>
          <Footer className="px-0 sm:px-0 lg:px-0" />
        </StoreProductsShowcase>
      </Suspense>
    </main>
  )
}
