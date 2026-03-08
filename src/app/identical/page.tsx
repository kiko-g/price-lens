import { redirect } from "next/navigation"

interface PageProps {
  searchParams: Promise<{ barcode?: string; canonical?: string }>
}

/**
 * Backward-compat redirect: /identical used to be the comparison page.
 * Now routes live under /products/barcode/[barcode] and /products/compare.
 */
export default async function IdenticalRedirect({ searchParams }: PageProps) {
  const { barcode, canonical } = await searchParams

  if (barcode) {
    redirect(`/products/barcode/${encodeURIComponent(barcode)}`)
  }

  if (canonical) {
    redirect(`/products/compare?canonical=${encodeURIComponent(canonical)}`)
  }

  redirect("/products")
}
