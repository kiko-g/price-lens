"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ShareIcon, CheckIcon } from "lucide-react"

interface OffProductActionsProps {
  productName: string
}

export function OffProductActions({ productName }: OffProductActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: productName,
      text: `Check out ${productName} on Price Lens`,
      url: shareUrl,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          copyToClipboard(shareUrl)
        }
      }
    } else {
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        toast.success("Link copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        toast.error("Failed to copy link")
      })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleShare}>
        {copied ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
        Share product
      </Button>
    </div>
  )
}
