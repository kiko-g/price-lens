"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("products.alertButton")

  const handleClick = async () => {
    if (!user) {
      setLoginPromptOpen(true)
      return
    }

    await toggleAlert()
    if (hasAlert) {
      toast.success(t("removed"))
    } else {
      toast.success(t("set", { name: productName }), { description: t("setDescription") })
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size={variant === "icon" ? "icon-lg" : "sm"} disabled className={className}>
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
              size={variant === "icon" ? "icon-lg" : "sm"}
              onClick={handleClick}
              disabled={isToggling}
              className={cn(hasAlert && "border-amber-500 bg-amber-500 text-white hover:bg-amber-600", className)}
              aria-label={hasAlert ? t("ariaRemove") : t("ariaSet")}
            >
              {isToggling ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : hasAlert ? (
                <BellOffIcon className="size-4" />
              ) : (
                <BellIcon className="size-4" />
              )}
              {variant !== "icon" && <span>{hasAlert ? t("labelOn") : t("labelOff")}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{hasAlert ? t("tooltipRemove") : t("tooltipSet")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <LoginPrompt open={loginPromptOpen} onOpenChange={setLoginPromptOpen} />
    </>
  )
}
