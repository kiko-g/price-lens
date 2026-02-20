import { ScrollToTop } from "./ScrollToTop"

export default function ProductIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  )
}
