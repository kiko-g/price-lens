import Link from "next/link"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, HomeIcon } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex w-full flex-grow flex-col items-center justify-center">
      <HeroGridPattern
        variant="grid"
        className="mask-[linear-gradient(to_top_left,rgba(255,255,255,0.4))]"
        width={16}
        height={16}
      />

      <div className="flex w-full flex-col items-center justify-center gap-3 px-4">
        <h1 className="animate-bounce text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
        <p className="text-muted-foreground max-w-sm text-center">
          Looks like you've ventured into the unknown digital realm.
        </p>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
            Go back
          </Button>

          <Button asChild>
            <Link href="/" prefetch={false}>
              <HomeIcon className="h-4 w-4" />
              Return to website
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
