import type { Metadata } from "next"

import { Layout } from "@/components/layout"

import { AiPriorityClassifier } from "@/components/admin/AiPriorityClassifier"

export const metadata: Metadata = {
  title: "AI Priority Classifier",
  description: "Run the AI priority classifier to classify products into priorities.",
}

export default function AdminAiPriorityClassifier() {
  return (
    <Layout>
      <AiPriorityClassifier />
    </Layout>
  )
}
