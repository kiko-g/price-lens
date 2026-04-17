"use client"

import { useFooter } from "@/contexts/FooterContext"
import { Footer } from "./Footer"

export function ControlledFooter({ className }: { className?: string }) {
  const { isFooterHidden } = useFooter()

  if (isFooterHidden)
    return <div className="pb-[env(safe-area-inset-bottom,0px)] [@media(display-mode:standalone)]:pb-0" />

  return <Footer className={className} />
}
