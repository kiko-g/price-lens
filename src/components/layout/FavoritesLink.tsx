import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"
import { HeartIcon } from "lucide-react"

export function FavoritesLink() {
  const { user } = useUser()

  if (!user) return null

  return (
    <Button variant="outline" size="icon" className="relative" asChild>
      <Link href="/favorites">
        <HeartIcon className="h-4 w-4" />
        <span className="bg-destructive/80 text-2xs absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full px-1 py-1.5 leading-none tracking-tighter text-white">
          <span className="h-[6px] w-[6px] rounded-full bg-white" />
        </span>
      </Link>
    </Button>
  )
}
