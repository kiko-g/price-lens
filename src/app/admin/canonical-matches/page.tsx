import { Suspense } from "react"
import type { Metadata } from "next"
import { CanonicalMatchReview } from "@/components/admin/CanonicalMatchReview"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Canonical Products | Admin",
  description: "Browse and manage canonical product groupings across stores",
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

export default function CanonicalMatchesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CanonicalMatchReview />
    </Suspense>
  )
}
