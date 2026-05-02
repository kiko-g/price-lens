import { BarcodeLookupSessionCleanup } from "@/components/products/BarcodeLookupSessionCleanup"

export default function ProductIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BarcodeLookupSessionCleanup />
      {children}
    </>
  )
}
