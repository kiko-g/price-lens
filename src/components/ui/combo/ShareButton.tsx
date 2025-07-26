"use client"

import { useState } from "react"
import { Check, Copy, Mail, Share2, Twitter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { XTwitterIcon } from "@/components/icons"

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ShareButton({ url, title, description = "", variant = "outline", size = "sm" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = url || typeof window !== "undefined" ? window.location.href : ""

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
        toast.success("Shared successfully")
      } catch (error) {
        console.error("Error sharing:", error)
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("Failed to share")
        }
      }
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true)
        toast.success("Link copied to clipboard", {
          description: "You can now paste it anywhere",
          icon: <Check className="h-4 w-4" />,
        })

        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast.error("Failed to copy link", {
          description: "Please try again or copy manually",
        })
      })
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${description}\n\n${shareUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
    toast("Email client opened", {
      description: "Compose your email to share",
    })
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`${title}\n${shareUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
    toast("Sharing on Twitter", {
      icon: <XTwitterIcon className="h-4 w-4" />,
    })
  }

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
    toast("Sharing on WhatsApp")
  }

  const isWebShareAvailable = typeof navigator !== "undefined" && !!navigator.share

  return (
    <TooltipProvider>
      {isWebShareAvailable ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={variant} size={size} onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share this product</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareViaEmail}>
              <Mail className="h-4 w-4" />
              Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={shareOnTwitter}>
              <Twitter className="h-4 w-4 stroke-blue-500" />
              Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareOnWhatsApp}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlSpace="preserve"
                width={200}
                height={200}
                viewBox="0 0 308 308"
                className="h-4 w-4 fill-current text-green-500"
              >
                <path d="M227.904 176.981c-.6-.288-23.054-11.345-27.044-12.781-1.629-.585-3.374-1.156-5.23-1.156-3.032 0-5.579 1.511-7.563 4.479-2.243 3.334-9.033 11.271-11.131 13.642-.274.313-.648.687-.872.687-.201 0-3.676-1.431-4.728-1.888-24.087-10.463-42.37-35.624-44.877-39.867-.358-.61-.373-.887-.376-.887.088-.323.898-1.135 1.316-1.554 1.223-1.21 2.548-2.805 3.83-4.348a140.77 140.77 0 0 1 1.812-2.153c1.86-2.164 2.688-3.844 3.648-5.79l.503-1.011c2.344-4.657.342-8.587-.305-9.856-.531-1.062-10.012-23.944-11.02-26.348-2.424-5.801-5.627-8.502-10.078-8.502-.413 0 0 0-1.732.073-2.109.089-13.594 1.601-18.672 4.802C90 87.918 80.89 98.74 80.89 117.772c0 17.129 10.87 33.302 15.537 39.453.116.155.329.47.638.922 17.873 26.102 40.154 45.446 62.741 54.469 21.745 8.686 32.042 9.69 37.896 9.69h.001c2.46 0 4.429-.193 6.166-.364l1.102-.105c7.512-.666 24.02-9.22 27.775-19.655 2.958-8.219 3.738-17.199 1.77-20.458-1.348-2.216-3.671-3.331-6.612-4.743z" />
                <path d="M156.734 0C73.318 0 5.454 67.354 5.454 150.143c0 26.777 7.166 52.988 20.741 75.928L.212 302.716a3.998 3.998 0 0 0 4.999 5.096l79.92-25.396c21.87 11.685 46.588 17.853 71.604 17.853C240.143 300.27 308 232.923 308 150.143 308 67.354 240.143 0 156.734 0zm0 268.994c-23.539 0-46.338-6.797-65.936-19.657a3.996 3.996 0 0 0-3.406-.467l-40.035 12.726 12.924-38.129a4.002 4.002 0 0 0-.561-3.647c-14.924-20.392-22.813-44.485-22.813-69.677 0-65.543 53.754-118.867 119.826-118.867 66.064 0 119.812 53.324 119.812 118.867.001 65.535-53.746 118.851-119.811 118.851z" />
              </svg>
              WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </TooltipProvider>
  )
}
