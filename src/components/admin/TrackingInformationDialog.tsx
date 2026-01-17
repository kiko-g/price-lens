"use client"

import Link from "next/link"
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

import { InfoIcon } from "lucide-react"

export function TrackingInformationDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="hover:bg-accent cursor-pointer px-2" variant="dropdown-item">
          Learn more about tracking
          <InfoIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>About tracking products</DialogTitle>

          <div className="prose space-y-2 text-left text-sm">
            <p>
              Price Lens collects price information across time and finds prices of store products on their store
              origins. Given that there are so many products out there, with varying relevancy of price tracking, we
              employed a simple priority tracking system. Each store product has a priority level, from 0 to 5.
            </p>

            <p>
              The higher the priority, the more often the prices are updated. As of September 2025,{" "}
              <strong>only products with a priority of at least 3 are being tracked</strong>. We are working on ways to
              improve this system to make it smarter and feel more natural. Until then you may see relevant products
              that have no price history.
            </p>

            <p>
              To combat this, you can{" "}
              <strong>add a product to your favorites to increase its priority to 5/5 automatically</strong>. To have
              favorites, you need to be logged in.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Got it, thanks.</Button>
            </DialogClose>

            <Button variant="primary" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
