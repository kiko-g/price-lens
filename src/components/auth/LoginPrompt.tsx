"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-2 text-center">
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <HeartIcon className="text-destructive size-6" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold tracking-tight">Save your favorites</h3>
        <p className="text-muted-foreground text-sm text-balance">
          Sign in to monitor prices on the products you care about. We can tell you when it is the best time to buy.
        </p>
      </div>

      <Button asChild variant="marketing-default" size="lg" className="w-full max-w-xs">
        <Link href={loginHref}>
          <GoogleIcon />
          Continue with Google
        </Link>
      </Button>

      <p className="text-muted-foreground/60 text-xs">No spam, ever.</p>
    </div>
  )
}

export function LoginPrompt({ open, onOpenChange }: LoginPromptProps) {
  const isMobile = useIsMobile()
  const pathname = usePathname()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Sign in</DrawerTitle>
            <DrawerDescription>Sign in to save favorites</DrawerDescription>
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
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Sign in to save favorites</DialogDescription>
        </DialogHeader>
        <LoginPromptBody pathname={pathname} />
      </DialogContent>
    </Dialog>
  )
}
