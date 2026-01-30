"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  SearchIcon,
  LinkIcon,
  Link2OffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XIcon,
  FilterIcon,
} from "lucide-react"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"
import type { CanonicalCategory, StoreCategoryTuple, CreateCategoryMappingInput } from "@/types"
import { cn, getCenteredArray } from "@/lib/utils"

interface CategoryMappingsTableProps {
  canonicalCategories: CanonicalCategory[]
}

const STORE_LOGOS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: ContinenteSvg,
  2: AuchanSvg,
  3: PingoDoceSvg,
}

const ITEMS_PER_PAGE = 50

export function CategoryMappingsTable({ canonicalCategories }: CategoryMappingsTableProps) {
  const [search, setSearch] = useState("")
  const [originFilter, setOriginFilter] = useState<string>("all")
  const [mappedFilter, setMappedFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selectedTuples, setSelectedTuples] = useState<Set<string>>(new Set())
  const [mapDialogOpen, setMapDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["store-category-tuples", originFilter, mappedFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (originFilter !== "all") params.set("origin_id", originFilter)
      if (mappedFilter !== "all") params.set("mapped", mappedFilter)
      if (search) params.set("search", search)
      params.set("limit", String(ITEMS_PER_PAGE))
      params.set("offset", String((page - 1) * ITEMS_PER_PAGE))

      const res = await axios.get(`/api/admin/categories/tuples?${params}`)
      return res.data as { data: StoreCategoryTuple[]; count: number }
    },
    staleTime: 30000,
  })

  const tuples = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Flatten canonical categories for select dropdown
  const flatCategories = useMemo(() => {
    const result: { id: number; name: string; path: string; level: number }[] = []
    const flatten = (cats: CanonicalCategory[], path: string[] = []) => {
      for (const cat of cats) {
        const currentPath = [...path, cat.name]
        result.push({
          id: cat.id,
          name: cat.name,
          path: currentPath.join(" > "),
          level: cat.level,
        })
        if (cat.children) flatten(cat.children, currentPath)
      }
    }
    flatten(canonicalCategories)
    return result
  }, [canonicalCategories])

  const getTupleKey = (tuple: StoreCategoryTuple) =>
    `${tuple.origin_id}|${tuple.store_category}|${tuple.store_category_2 ?? ""}|${tuple.store_category_3 ?? ""}`

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = tuples.filter((t) => !t.is_mapped).map(getTupleKey)
      setSelectedTuples(new Set(allKeys))
    } else {
      setSelectedTuples(new Set())
    }
  }

  const handleSelectTuple = (tuple: StoreCategoryTuple, checked: boolean) => {
    const key = getTupleKey(tuple)
    setSelectedTuples((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  const unmappedTuples = tuples.filter((t) => !t.is_mapped)
  const allUnmappedSelected =
    unmappedTuples.length > 0 && unmappedTuples.every((t) => selectedTuples.has(getTupleKey(t)))

  const handleClearFilters = () => {
    setSearch("")
    setOriginFilter("all")
    setMappedFilter("all")
    setPage(1)
  }

  const selectedTuplesList = useMemo(() => {
    return tuples.filter((t) => selectedTuples.has(getTupleKey(t)))
  }, [tuples, selectedTuples])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LinkIcon className="text-primary h-5 w-5" />
            Store Category Mappings
          </CardTitle>
          <Button onClick={() => setMapDialogOpen(true)} disabled={selectedTuples.size === 0}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Map {selectedTuples.size} Selected
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={originFilter}
            onValueChange={(v) => {
              setOriginFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="1">Continente</SelectItem>
              <SelectItem value="2">Auchan</SelectItem>
              <SelectItem value="3">Pingo Doce</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={mappedFilter}
            onValueChange={(v) => {
              setMappedFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Mapped</SelectItem>
              <SelectItem value="false">Unmapped</SelectItem>
            </SelectContent>
          </Select>

          {(search || originFilter !== "all" || mappedFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <XIcon className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Results summary */}
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {page * ITEMS_PER_PAGE - (ITEMS_PER_PAGE - 1)}-{Math.min(page * ITEMS_PER_PAGE, totalCount)} of{" "}
            {totalCount} category tuples
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTuples(new Set())}
            disabled={selectedTuples.size === 0}
          >
            Clear Selection ({selectedTuples.size})
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allUnmappedSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all unmapped"
                  />
                </TableHead>
                <TableHead className="w-[100px]">Store</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-category</TableHead>
                <TableHead>Sub-sub-category</TableHead>
                <TableHead className="w-[100px] text-right">Products</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[200px]">Canonical</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : tuples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <span className="text-muted-foreground">No category tuples found</span>
                  </TableCell>
                </TableRow>
              ) : (
                tuples.map((tuple) => {
                  const key = getTupleKey(tuple)
                  const isSelected = selectedTuples.has(key)
                  const Logo = STORE_LOGOS[tuple.origin_id]

                  return (
                    <TableRow key={key} className={cn(isSelected && "bg-muted/50")}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectTuple(tuple, !!checked)}
                          disabled={tuple.is_mapped}
                          aria-label={`Select ${tuple.store_category}`}
                        />
                      </TableCell>
                      <TableCell>{Logo && <Logo className="h-3 w-16" />}</TableCell>
                      <TableCell className="font-medium">{tuple.store_category}</TableCell>
                      <TableCell className="text-muted-foreground">{tuple.store_category_2 || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{tuple.store_category_3 || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {tuple.product_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {tuple.is_mapped ? (
                          <Badge variant="glass-success">
                            <CheckIcon className="mr-1 h-3 w-3" />
                            Mapped
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            <Link2OffIcon className="mr-1 h-3 w-3" />
                            Unmapped
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {tuple.is_mapped ? (
                          <MappingCell
                            tuple={tuple}
                            flatCategories={flatCategories}
                            onUpdate={() => {
                              refetch()
                              queryClient.invalidateQueries({ queryKey: ["admin-categories-stats"] })
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="isolate flex -space-x-px">
              <Button
                variant="outline"
                className="rounded-r-none focus:z-10"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeftIcon className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Select value={page.toString()} onValueChange={(v) => setPage(parseInt(v, 10))}>
                <SelectTrigger className="w-auto min-w-20 justify-center rounded-none font-medium lg:w-full">
                  <SelectValue placeholder={page} />
                </SelectTrigger>
                <SelectContent>
                  {getCenteredArray(Math.min(totalPages, 50), page, totalPages || null).map((num: number) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="rounded-l-none focus:z-10"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Map Dialog */}
        <BulkMapDialog
          open={mapDialogOpen}
          onOpenChange={setMapDialogOpen}
          selectedTuples={selectedTuplesList}
          flatCategories={flatCategories}
          onSuccess={() => {
            setSelectedTuples(new Set())
            refetch()
            queryClient.invalidateQueries({ queryKey: ["admin-categories-stats"] })
          }}
        />
      </CardContent>
    </Card>
  )
}

interface MappingCellProps {
  tuple: StoreCategoryTuple
  flatCategories: { id: number; name: string; path: string; level: number }[]
  onUpdate: () => void
}

function MappingCell({ tuple, flatCategories, onUpdate }: MappingCellProps) {
  const [editing, setEditing] = useState(false)
  const [selectedId, setSelectedId] = useState<string>(String(tuple.canonical_category_id ?? ""))

  const currentCategory = flatCategories.find((c) => c.id === tuple.canonical_category_id)

  const mutation = useMutation({
    mutationFn: async (canonical_category_id: number) => {
      await axios.put(`/api/admin/categories/mappings/${tuple.mapping_id}`, { canonical_category_id })
    },
    onSuccess: () => {
      toast.success("Mapping updated")
      setEditing(false)
      onUpdate()
    },
    onError: (error: any) => {
      toast.error("Error", { description: error.response?.data?.error || "Failed to update mapping" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/admin/categories/mappings/${tuple.mapping_id}`)
    },
    onSuccess: () => {
      toast.success("Mapping removed")
      onUpdate()
    },
    onError: (error: any) => {
      toast.error("Error", { description: error.response?.data?.error || "Failed to remove mapping" })
    },
  })

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {flatCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                <span className="text-xs">{cat.path}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => mutation.mutate(parseInt(selectedId))}
          disabled={mutation.isPending}
        >
          <CheckIcon className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
          <XIcon className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-1">
      <span className="truncate text-xs" title={currentCategory?.path}>
        {currentCategory?.name || "Unknown"}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => setEditing(true)}
      >
        <FilterIcon className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        <XIcon className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface BulkMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTuples: StoreCategoryTuple[]
  flatCategories: { id: number; name: string; path: string; level: number }[]
  onSuccess: () => void
}

function BulkMapDialog({ open, onOpenChange, selectedTuples, flatCategories, onSuccess }: BulkMapDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return flatCategories
    const query = searchQuery.toLowerCase()
    return flatCategories.filter((c) => c.name.toLowerCase().includes(query) || c.path.toLowerCase().includes(query))
  }, [flatCategories, searchQuery])

  const mutation = useMutation({
    mutationFn: async (mappings: CreateCategoryMappingInput[]) => {
      const res = await axios.post("/api/admin/categories/mappings", { mappings })
      return res.data
    },
    onSuccess: (data) => {
      toast.success("Mappings created", { description: `Successfully mapped ${data.count} category tuples` })
      setSelectedCategoryId("")
      setSearchQuery("")
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: any) => {
      toast.error("Error", { description: error.response?.data?.error || "Failed to create mappings" })
    },
  })

  const handleSubmit = () => {
    if (!selectedCategoryId) return

    const mappings: CreateCategoryMappingInput[] = selectedTuples.map((tuple) => ({
      origin_id: tuple.origin_id,
      store_category: tuple.store_category,
      store_category_2: tuple.store_category_2,
      store_category_3: tuple.store_category_3,
      canonical_category_id: parseInt(selectedCategoryId),
    }))

    mutation.mutate(mappings)
  }

  const selectedCategory = flatCategories.find((c) => c.id === parseInt(selectedCategoryId))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Map Categories</DialogTitle>
          <DialogDescription>
            Map {selectedTuples.length} store category tuple{selectedTuples.length !== 1 ? "s" : ""} to a canonical
            category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {/* Selected tuples preview */}
          <div className="space-y-2">
            <Label>Selected Tuples</Label>
            <ScrollArea className="h-[120px] rounded-md border p-2">
              <div className="space-y-1">
                {selectedTuples.map((tuple) => {
                  const Logo = STORE_LOGOS[tuple.origin_id]
                  return (
                    <div
                      key={`${tuple.origin_id}-${tuple.store_category}-${tuple.store_category_2}-${tuple.store_category_3}`}
                      className="flex items-center gap-2 text-xs"
                    >
                      {Logo && <Logo className="h-3 w-20" />}
                      <span className="font-medium">{tuple.store_category}</span>
                      {tuple.store_category_2 && (
                        <>
                          <span className="text-muted-foreground">{">"}</span>
                          <span>{tuple.store_category_2}</span>
                        </>
                      )}
                      {tuple.store_category_3 && (
                        <>
                          <span className="text-muted-foreground">{">"}</span>
                          <span>{tuple.store_category_3}</span>
                        </>
                      )}
                      <span className="text-muted-foreground ml-auto">({tuple.product_count} products)</span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Category selector */}
          <div className="space-y-2">
            <Label>Map to Canonical Category</Label>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-2">
                {filteredCategories.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">No categories found</p>
                ) : (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(String(cat.id))}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        selectedCategoryId === String(cat.id) ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                          selectedCategoryId === String(cat.id) ? "bg-primary-foreground text-primary" : "bg-muted",
                        )}
                      >
                        {cat.level}
                      </span>
                      <span className="flex-1 truncate">{cat.path}</span>
                      {selectedCategoryId === String(cat.id) && <CheckIcon className="h-4 w-4" />}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
            {selectedCategory && (
              <p className="text-muted-foreground text-xs">
                Selected: <span className="text-foreground font-medium">{selectedCategory.path}</span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedCategoryId || mutation.isPending}>
            {mutation.isPending
              ? "Creating..."
              : `Map ${selectedTuples.length} Tuple${selectedTuples.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
