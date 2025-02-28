import Link from "next/link"
import { Layout } from "@/components/layout"
import { GridHome } from "@/components/home/GridHome"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"

export default function NotFound() {
  return (
    <Layout>
      <GridHome />

      <div className="flex w-full flex-col items-center justify-center gap-3">
        <h1 className="animate-bounce text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
        <p className="text-gray-500 dark:text-gray-400">Looks like you've ventured into the unknown digital realm.</p>

        <Button asChild>
          <Link href="/" prefetch={false}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Return to website
          </Link>
        </Button>
      </div>
    </Layout>
  )
}
