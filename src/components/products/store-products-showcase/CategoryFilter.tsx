"use client"

import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { CanonicalCategory } from "@/types"
import { cn } from "@/lib/utils"
import { toCategorySlug, parseCategoryId } from "./url-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CircleCheckIcon, ChevronDownIcon } from "lucide-react"

export type FlatCategory = {
  id: number
  name: string
  breadcrumb: string
  level: 1 | 2 | 3
  slug: string
}

export function useCanonicalCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ["canonicalCategories", "tree"],
    queryFn: async () => {
      const res = await axios.get("/api/categories/canonical")
      return res.data.data as CanonicalCategory[]
    },
    staleTime: 1000 * 60 * 60,
  })

  return { categories: data ?? [], isLoading }
}

export function useFlatCategories(categories: CanonicalCategory[]) {
  return useMemo(() => {
    const flat: FlatCategory[] = []
    const walk = (cats: CanonicalCategory[], ancestors: string[]) => {
      for (const cat of cats) {
        const path = [...ancestors, cat.name]
        flat.push({
          id: cat.id,
          name: cat.name,
          breadcrumb: path.join(" > "),
          level: cat.level,
          slug: toCategorySlug(cat.id, cat.name),
        })
        if (cat.children?.length) walk(cat.children, path)
      }
    }
    walk(categories, [])
    return flat
  }, [categories])
}

function CategorySearchList({
  flatCategories,
  selectedSlug,
  onSelect,
}: {
  flatCategories: FlatCategory[]
  selectedSlug: string
  onSelect: (slug: string) => void
}) {
  const selectedId = parseCategoryId(selectedSlug)

  return (
    <Command className="rounded-md border" shouldFilter>
      <CommandInput placeholder="Search categories..." className="h-9 border-0 focus:ring-0" />
      <CommandList className="max-h-[280px]">
        <CommandEmpty>No categories found.</CommandEmpty>
        <CommandGroup>
          {flatCategories.map((cat) => (
            <CommandItem
              key={cat.id}
              value={cat.breadcrumb}
              onSelect={() => onSelect(cat.id === selectedId ? "" : cat.slug)}
              className="gap-2"
            >
              <CircleCheckIcon
                className={cn("h-3.5 w-3.5 shrink-0", cat.id === selectedId ? "text-primary opacity-100" : "opacity-0")}
              />
              <span className="flex-1 truncate">
                {cat.level === 1 ? (
                  <span className="font-medium">{cat.name}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {cat.breadcrumb.split(" > ").slice(0, -1).join(" > ")}
                    {" > "}
                    <span className="text-foreground">{cat.name}</span>
                  </span>
                )}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

interface CategoryFilterProps {
  selectedCategorySlug: string
  onCategoryChange: (categorySlug: string) => void
  className?: string
}

export function CanonicalCategoryCascade({ selectedCategorySlug, onCategoryChange, className }: CategoryFilterProps) {
  const { categories, isLoading } = useCanonicalCategories()
  const flatCategories = useFlatCategories(categories)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const selectedId = parseCategoryId(selectedCategorySlug)
  const selectedCategory = flatCategories.find((c) => c.id === selectedId)

  const handleSelect = useCallback(
    (slug: string) => {
      onCategoryChange(slug)
      setPopoverOpen(false)
    },
    [onCategoryChange],
  )

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className={cn(
            "h-8 w-full justify-between text-sm font-normal",
            selectedCategory && "border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/15",
          )}
        >
          <span className="truncate">{selectedCategory ? selectedCategory.breadcrumb : "All categories"}</span>
          <ChevronDownIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-lg min-w-(--radix-popover-trigger-width) p-0", className)} align="start">
        <CategorySearchList
          flatCategories={flatCategories}
          selectedSlug={selectedCategorySlug}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
