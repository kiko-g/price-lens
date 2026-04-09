"use client"

import { useState } from "react"
import { useUser } from "@/hooks/useUser"
import { useAlertToggle } from "@/hooks/useAlertToggle"
import { LoginPrompt } from "@/components/auth/LoginPrompt"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BellIcon, BellOffIcon, LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AlertButtonProps {
  storeProductId: number
  productName: string
  className?: string
  variant?: "icon" | "default"
}

export function AlertButton({ storeProductId, productName, className, variant = "default" }: AlertButtonProps) {
  const { user } = useUser()
  const { hasAlert, isLoading, isToggling, toggleAlert } = useAlertToggle(storeProductId)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  const handleClick = async () => {
    if (!user) {
      setLoginPromptOpen(true)
      return
    }

    await toggleAlert()
    if (hasAlert) {
      toast.success("Alert removed")
    } else {
      toast.success(`Alert set for ${productName}`, { description: "We'll notify you when the price drops." })
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size={variant === "icon" ? "icon" : "sm"} disabled className={className}>
        <LoaderIcon className="size-4 animate-spin" />
      </Button>
    )
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasAlert ? "default" : "outline"}
              size={variant === "icon" ? "icon" : "sm"}
              onClick={handleClick}
              disabled={isToggling}
              className={cn(hasAlert && "border-amber-500 bg-amber-500 text-white hover:bg-amber-600", className)}
              aria-label={hasAlert ? "Remove price alert" : "Set price alert"}
            >
              {isToggling ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : hasAlert ? (
                <BellOffIcon className="size-4" />
              ) : (
                <BellIcon className="size-4" />
              )}
              {variant !== "icon" && <span className="ml-1.5">{hasAlert ? "Alert on" : "Alert me"}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{hasAlert ? "Remove price alert" : "Get notified when price drops"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <LoginPrompt open={loginPromptOpen} onOpenChange={setLoginPromptOpen} />
    </>
  )
}
