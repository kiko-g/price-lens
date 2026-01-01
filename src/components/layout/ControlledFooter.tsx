"use client"

import { useFooter } from "@/contexts/FooterContext"
import { Footer } from "./Footer"

export function ControlledFooter({ className }: { className?: string }) {
  const { isFooterHidden } = useFooter()

  if (isFooterHidden) return null

  return <Footer className={className} />
}
