"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"

import { SearchIcon, PackageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const popularProducts = [
  {
    label: "Cápsulas de Café",
    value: "capsulas de cafe",
  },
  {
    label: "Leite",
    value: "leite",
  },
  {
    label: "Atum",
    value: "atum",
  },
  {
    label: "Iogurte Grego",
    value: "iogurte grego",
  },
  {
    label: "Fiambre",
    value: "fiambre",
  },
  {
    label: "Häagen-Dazs",
    value: "haagen dazs",
  },
  {
    label: "Gold Nutrition",
    value: "gold nutrition",
  },
  {
    label: "Salmão",
    value: "salmao",
  },
  {
    label: "Chocolate",
    value: "chocolate",
  },
  {
    label: "Cereais",
    value: "cereais",
  },
  {
    label: "Biscoitos",
    value: "biscoitos",
  },
  {
    label: "Bolachas",
    value: "bolachas",
  },
]

type Props = {
  forceRefresh?: boolean
  children?: React.ReactNode
}

export function SearchDialog({ children, forceRefresh = true }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (searchQuery: string, forceRefresh: boolean) => {
    if (searchQuery.trim()) {
      setOpen(false)
      setQuery("")
      window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      const forceRefresh = e.ctrlKey || e.metaKey
      handleSearch(query, forceRefresh)
    }
  }

  const filteredProducts = popularProducts.filter((product) =>
    product.value.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <SearchIcon className="h-4 w-4" />
            <span className="sr-only">Search products</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm rounded-lg border-transparent p-3 md:max-w-xl md:p-6">
        <DialogHeader>
          <DialogTitle className="text-left">Find a supermarket product</DialogTitle>
        </DialogHeader>
        <Command className="border shadow-none">
          <CommandInput
            placeholder="What product are you looking for?"
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleKeyDown}
            className="border-0 text-base shadow-none ring-0 md:text-sm"
          />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            {query.trim() && (
              <CommandGroup heading="Search">
                <CommandItem
                  onSelect={() => handleSearch(query.trim().toLowerCase().normalize("NFD"), forceRefresh)}
                  className="cursor-pointer"
                >
                  <SearchIcon className="h-4 w-4" />
                  Search for "{query}"
                </CommandItem>
              </CommandGroup>
            )}

            {filteredProducts.length > 0 && (
              <CommandGroup heading="Popular Products">
                {popularProducts
                  .filter((product) => product.value.toLowerCase().includes(query.toLowerCase()))
                  .map((product) => (
                    <CommandItem
                      key={product.value}
                      onSelect={() => handleSearch(product.value, forceRefresh)}
                      className="cursor-pointer"
                    >
                      <PackageIcon className="h-4 w-4" />
                      {product.label}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {!query.trim() && filteredProducts.length === 0 && (
              <CommandEmpty>Start typing to search for products...</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
