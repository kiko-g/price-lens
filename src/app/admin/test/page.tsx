import type { Metadata } from "next"

import { Layout } from "@/components/layout"

import { TestScrapers } from "@/components/admin/TestScrapers"

export const metadata: Metadata = {
  title: "Test Scrapers",
  description: "Test the api scrapers and visualize the results",
}

export default function AdminTestScrapers() {
  return (
    <Layout>
      <TestScrapers />
    </Layout>
  )
}
