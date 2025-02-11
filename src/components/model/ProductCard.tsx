"use client"

import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { ArrowUpRightIcon, CopyIcon, EllipsisVerticalIcon } from "lucide-react"
import { cn, imagePlaceholder } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  if (!product.url) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border bg-white p-4 dark:bg-zinc-950">
      <div className="relative flex items-center justify-between gap-2">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name || "Product Image"}
            width={100}
            height={100}
            className="aspect-square w-full rounded-md border"
            placeholder="blur"
            blurDataURL={imagePlaceholder.productBlur}
          />
        ) : (
          <div className="aspect-square w-full rounded-md bg-zinc-100 dark:bg-zinc-900" />
        )}

        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default-inverted" size="icon-sm" className="shadow-none">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem asChild>
                <Button
                  size="dropdown-item"
                  variant="dropdown-item"
                  onClick={() => navigator.clipboard.writeText(product.url || "")}
                >
                  Copy
                  <CopyIcon />
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button variant="dropdown-item" size="dropdown-item" asChild>
                  <Link
                    href={product.url || "#"}
                    target="_blank"
                    className="flex w-full items-center justify-between gap-1"
                  >
                    Open in new tab
                    <ArrowUpRightIcon />
                  </Link>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col items-start">
        <span className="text-xs font-semibold uppercase tracking-tighter text-zinc-500 dark:text-zinc-400">
          {product.brand}
        </span>
        <h2 className="text-sm font-medium tracking-tighter">{product.name || "Untitled"}</h2>
      </div>

      {product.price_recommended || product.price ? (
        <div className="flex items-center gap-2">
          <p className={cn("text-sm", product.price_recommended !== product.price && "line-through opacity-50")}>
            {product.price_recommended}€
          </p>

          <p className="text-sm font-semibold text-emerald-400">{product.price}€</p>
        </div>
      ) : null}

      {(product.created_at || product.updated_at) && (
        <footer className="mt-3 flex flex-col items-center justify-end gap-2 border-t pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{product.created_at}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{product.updated_at}</p>
        </footer>
      )}
    </div>
  )
}
