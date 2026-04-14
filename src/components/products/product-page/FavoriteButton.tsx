"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import type { StoreProduct } from "@/types"
import { useUser } from "@/hooks/useUser"
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle"

import { Button } from "@/components/ui/button"
import { LoginPrompt } from "@/components/auth/LoginPrompt"
import { HeartIcon } from "lucide-react"

export function FavoriteButton({
  storeProduct,
  compact = false,
}: {
  storeProduct: StoreProduct
  compact?: boolean
}) {
  const { user } = useUser()
  const { toggleFavorite, isLoading } = useFavoriteToggle()
  const [isFavorited, setIsFavorited] = useState(storeProduct.is_favorited ?? false)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  const favoriteLoading = isLoading(storeProduct.id ?? 0)

  const handleToggleFavorite = async () => {
    if (!storeProduct.id) return

    const result = await toggleFavorite(storeProduct.id, isFavorited, storeProduct.name)
    if (result.success) {
      setIsFavorited(result.newState)
    }
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size={compact ? "icon-lg" : "sm"}
          onClick={() => setLoginPromptOpen(true)}
          title="Sign in to save favorites"
          aria-label="Sign in to add to favorites"
        >
          <HeartIcon className="h-4 w-4" />
          {!compact ? "Add to favorites" : null}
        </Button>
        <LoginPrompt open={loginPromptOpen} onOpenChange={setLoginPromptOpen} />
      </>
    )
  }

  return (
    <Button
      variant="outline"
      size={compact ? "icon-lg" : "sm"}
      onClick={handleToggleFavorite}
      disabled={favoriteLoading}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <HeartIcon
        className={cn(
          "h-4 w-4",
          isFavorited ? "fill-destructive stroke-destructive" : "stroke-foreground fill-none",
          favoriteLoading && "animate-pulse",
        )}
      />
      {!compact ? (isFavorited ? "Remove from favorites" : "Add to favorites") : null}
    </Button>
  )
}
