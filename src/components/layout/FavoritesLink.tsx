import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"
import { HeartIcon } from "lucide-react"
import { useFavoritesCount } from "@/hooks/useFavorites"

export function FavoritesLink({ onClick }: { onClick?: () => void }) {
  const { user, isLoading: isUserLoading } = useUser()
  const { count, isLoading: isFavoritesLoading } = useFavoritesCount(user?.id ?? "")

  if (!user || isUserLoading || isFavoritesLoading) {
    return (
      <Button variant="outline" size="icon" className="relative" asChild disabled>
        <Link href="/favorites">
          <HeartIcon className="h-4 w-4 animate-pulse" />
          <span className="sr-only">Favorites</span>
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="outline" size="icon" className="relative" asChild>
      <Link href="/favorites" onClick={() => onClick?.()}>
        <HeartIcon className="h-4 w-4" />
        {count > 0 && (
          <span className="bg-destructive text-2xs absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full px-1 py-1.5 leading-none tracking-tighter text-white">
            {count}
          </span>
        )}
      </Link>
    </Button>
  )
}
