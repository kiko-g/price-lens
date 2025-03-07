import { Layout } from "@/components/layout"
import { SupermarketProductPageById } from "@/components/model/SupermarketProductPage"

export default async function ProductPageSupermarket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id) {
    return (
      <Layout>
        <div>No id</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
        <SupermarketProductPageById id={id as string} />
      </div>
    </Layout>
  )
}
