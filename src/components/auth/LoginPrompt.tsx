"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useIsMobile } from "@/hooks/use-mobile"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

import { HeartIcon } from "lucide-react"

interface LoginPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function LoginPromptBody({ pathname }: { pathname: string }) {
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`
  const t = useTranslations("auth.loginPrompt")

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-2 text-center">
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <HeartIcon className="text-destructive size-6" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold tracking-tight">{t("title")}</h3>
        <p className="text-muted-foreground text-sm text-balance">{t("body")}</p>
      </div>

      <Button asChild variant="marketing-default" size="lg" className="w-full max-w-xs">
        <Link href={loginHref}>
          <GoogleIcon />
          {t("continueWithGoogle")}
        </Link>
      </Button>

      <p className="text-muted-foreground/60 text-xs">{t("noSpam")}</p>
    </div>
  )
}

export function LoginPrompt({ open, onOpenChange }: LoginPromptProps) {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const t = useTranslations("auth.loginPrompt")

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>{t("ariaTitle")}</DrawerTitle>
            <DrawerDescription>{t("ariaDescription")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <LoginPromptBody pathname={pathname} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("ariaTitle")}</DialogTitle>
          <DialogDescription>{t("ariaDescription")}</DialogDescription>
        </DialogHeader>
        <LoginPromptBody pathname={pathname} />
      </DialogContent>
    </Dialog>
  )
}
