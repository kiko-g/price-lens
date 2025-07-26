import Link from "next/link"
import { Layout } from "@/components/layout"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"

export default function NotFound() {
  return (
    <Layout>
      <HeroGridPattern variant="grid" className="mask-[linear-gradient(to_top_left,rgba(255,255,255,0.4))]" />

      <div className="flex w-full flex-col items-center justify-center gap-3">
        <h1 className="animate-bounce text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
        <p className="text-muted-foreground">Looks like you've ventured into the unknown digital realm.</p>

        <Button asChild>
          <Link href="/" prefetch={false}>
            <ArrowLeftIcon className="h-4 w-4" />
            Return to website
          </Link>
        </Button>
      </div>
    </Layout>
  )
}
