import dynamic from "next/dynamic"
import { Loader2Icon } from "lucide-react"

const ProductsSegmentLoading = dynamic(() => import("./ProductsSegmentLoading"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-[50dvh] w-full flex-col items-center justify-center px-4" aria-busy="true">
      <Loader2Icon className="text-muted-foreground h-8 w-8 animate-spin" aria-hidden />
    </main>
  ),
})

export default function ProductsLoading() {
  return <ProductsSegmentLoading />
}
