import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/useFavorites"
import { useUser } from "@/hooks/useUser"

import { HeartIcon } from "lucide-react"

export function FavoritesLink() {
  const { user } = useUser()
  const { favorites } = useFavorites(1, 10)

  if (!user) return null

  return (
    <Button variant="outline" size="icon" className="relative" asChild>
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
