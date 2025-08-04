"use client"

import { useRouter } from "next/navigation"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"

export default function ErrorPage() {
  const router = useRouter()

  return (
    <Layout>
      <div className="my-auto flex w-full flex-col items-center justify-start gap-4 p-4">
        <span className="text-primary text-lg font-bold">404</span>
        <h1 className="text-5xl font-bold">Page not found</h1>
        <p>Sorry, something went wrong</p>
        <div className="flex flex-col gap-4 lg:flex-row">
          <Button variant="primary" onClick={() => router.back()}>
            Go back
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go back home
          </Button>
        </div>
      </div>
    </Layout>
  )
}
