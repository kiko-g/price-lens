import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeartIcon } from "lucide-react"
import { useFavorites } from "@/hooks/useFavorites"

export function FavoritesLink() {
  const { favorites } = useFavorites(1, 10)

  return (
    <Button variant="outline" size="icon-sm" className="relative" asChild>
      <Link href="/favorites">
        <HeartIcon className="h-4 w-4" />
        {favorites && favorites.length > 0 && (
          <span className="bg-destructive/80 text-2xs absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full p-1.5 text-white">
            {favorites.length}
          </span>
        )}
      </Link>
    </Button>
  )
}
