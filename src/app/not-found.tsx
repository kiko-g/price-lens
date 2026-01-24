import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HomeIcon } from "lucide-react"

// Global not-found page for invalid locales or paths outside [locale]
export default function GlobalNotFound() {
  return (
    <html lang="pt">
      <body className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tighter">404</h1>
          <p className="text-muted-foreground max-w-sm">Page not found.</p>
          <Button asChild>
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Return home
            </Link>
          </Button>
        </div>
      </body>
    </html>
  )
}
