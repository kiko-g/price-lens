"use client"

import Link from "next/link"
import { PRIORITY_CONFIG } from "@/lib/business/priority"
import { useUser } from "@/hooks/useUser"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { CheckIcon } from "lucide-react"

export function TrackingInformationDialog({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>About tracking products</DialogTitle>

          <div className="prose dark:prose-invert space-y-2 text-left text-sm">
            <p>
              Price Lens collects price information across time and finds prices of <strong>store products</strong> on
              their store origins. Given that there are so many products out there, with varying relevancy of price
              tracking, we employed a simple priority tracking system. Each store product has a priority level, from 0
              to 5 which determines how often the prices are scheduled to be checked.
            </p>

            <div className="flex flex-col gap-1">
              {Object.values(PRIORITY_CONFIG)
                .filter((priority) => priority.label !== "?")
                .map((priority) => (
                  <span key={priority.label} className="flex items-center gap-2">
                    <PriorityBubble priority={Number(priority.label)} size="xs" />
                    <span className="text-sm">{priority.explanation}</span>
                  </span>
                ))}
            </div>

            <p>
              If products have no price history, you can{" "}
              <strong>add a product to your favorites to increase its priority to 5 automatically</strong>. To have
              favorites, you need to be logged in.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">
                Acknowledge
                <CheckIcon className="mt-px" />
              </Button>
            </DialogClose>

            {!user ? (
              <Button variant="primary" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
