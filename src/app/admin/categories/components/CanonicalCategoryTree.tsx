"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  EditIcon,
  Trash2Icon,
  LayersIcon,
} from "lucide-react"

import type { CanonicalCategory, CreateCanonicalCategoryInput } from "@/types"
import { cn } from "@/lib/utils"

interface CanonicalCategoryTreeProps {
  categories: CanonicalCategory[]
  isLoading: boolean
}

export function CanonicalCategoryTree({ categories, isLoading }: CanonicalCategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<CanonicalCategory | null>(null)

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<number>()
    const collect = (cats: CanonicalCategory[]) => {
      for (const cat of cats) {
        allIds.add(cat.id)
        if (cat.children) collect(cat.children)
      }
    }
    collect(categories)
    setExpandedIds(allIds)
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const handleAddChild = (parent: CanonicalCategory | null) => {
    setSelectedParent(parent)
    setCreateDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayersIcon className="text-primary h-5 w-5" />
            Canonical Taxonomy
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
            <Button size="sm" onClick={() => handleAddChild(null)}>
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Root
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="ml-6 h-10 w-[calc(100%-1.5rem)]" />
            <Skeleton className="ml-6 h-10 w-[calc(100%-1.5rem)]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LayersIcon className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No Categories Yet</h3>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Start building your canonical taxonomy by adding root categories. These will serve as the foundation for
              normalizing store-specific categories.
            </p>
            <Button className="mt-4" onClick={() => handleAddChild(null)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map((category) => (
              <CategoryNode
                key={category.id}
                category={category}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onAddChild={handleAddChild}
                depth={0}
              />
            ))}
          </div>
        )}

        <CreateCategoryDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} parent={selectedParent} />
      </CardContent>
    </Card>
  )
}

interface CategoryNodeProps {
  category: CanonicalCategory
  expandedIds: Set<number>
  onToggle: (id: number) => void
  onAddChild: (parent: CanonicalCategory) => void
  depth: number
}

function CategoryNode({ category, expandedIds, onToggle, onAddChild, depth }: CategoryNodeProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const canAddChild = category.level < 3

  return (
    <div>
      <div
        className={cn(
          "hover:bg-muted/50 group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
          depth > 0 && "ml-6",
        )}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => hasChildren && onToggle(category.id)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded",
            hasChildren ? "hover:bg-muted cursor-pointer" : "cursor-default",
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        {/* Folder icon */}
        {hasChildren && isExpanded ? (
          <FolderOpenIcon className="text-primary h-4 w-4" />
        ) : (
          <FolderIcon className="text-muted-foreground h-4 w-4" />
        )}

        {/* Name */}
        <span className="flex-1 text-sm font-medium">{category.name}</span>

        {/* Level badge */}
        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">L{category.level}</span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canAddChild && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(category)}>
              <PlusIcon className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditDialogOpen(true)}>
            <EditIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-7 w-7"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <EditCategoryDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} category={category} />

      {/* Delete Confirmation */}
      <DeleteCategoryDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} category={category} />
    </div>
  )
}

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parent: CanonicalCategory | null
}

function CreateCategoryDialog({ open, onOpenChange, parent }: CreateCategoryDialogProps) {
  const [name, setName] = useState("")
  const queryClient = useQueryClient()

  const level = parent ? ((parent.level + 1) as 1 | 2 | 3) : 1

  const mutation = useMutation({
    mutationFn: async (input: CreateCanonicalCategoryInput) => {
      const res = await axios.post("/api/admin/categories/canonical", input)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canonical-categories-tree"] })
      queryClient.invalidateQueries({ queryKey: ["admin-categories-stats"] })
      toast.success("Category created", { description: `${name} has been added to the taxonomy.` })
      setName("")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error("Error", { description: error.response?.data?.error || "Failed to create category" })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    mutation.mutate({
      name: name.trim(),
      parent_id: parent?.id ?? null,
      level,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            {parent ? `Add a subcategory under "${parent.name}"` : "Add a new root category to your taxonomy"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {parent && (
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Input value={parent.name} disabled />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bebidas"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Level</Label>
              <Input value={`Level ${level}`} disabled />
              <p className="text-muted-foreground text-xs">
                {level === 1 && "Root category (top-level)"}
                {level === 2 && "Subcategory"}
                {level === 3 && "Sub-subcategory (deepest level)"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CanonicalCategory
}

function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const [name, setName] = useState(category.name)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await axios.put(`/api/admin/categories/canonical/${category.id}`, { name: newName })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canonical-categories-tree"] })
      toast.success("Category updated", { description: `Renamed to "${name}"` })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error("Error", { description: error.response?.data?.error || "Failed to update category" })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name === category.name) return
    mutation.mutate(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update the category name</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || name === category.name || mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CanonicalCategory
}

function DeleteCategoryDialog({ open, onOpenChange, category }: DeleteCategoryDialogProps) {
  const queryClient = useQueryClient()

  const hasChildren = category.children && category.children.length > 0

  const mutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/admin/categories/canonical/${category.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canonical-categories-tree"] })
      queryClient.invalidateQueries({ queryKey: ["admin-categories-stats"] })
      toast.success("Category deleted", { description: `"${category.name}" has been removed.` })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error("Error", { description: error.response?.data?.error || "Failed to delete category" })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{category.name}&quot;?
            {hasChildren && (
              <span className="mt-2 block font-medium text-amber-600">
                Warning: This will also delete all {category.children!.length} child categories and their mappings.
              </span>
            )}
            <span className="mt-2 block">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
