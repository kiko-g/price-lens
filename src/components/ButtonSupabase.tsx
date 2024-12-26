import { createClient } from "@/lib/supabase/server"

export async function ButtonSupabase() {
  const supabase = createClient()
  const { data: products } = await supabase.from("products").select("*")
  console.debug(products)

  return (
    <div className="max-w-md p-4">
      <pre className="text-wrap text-xs">{JSON.stringify(products, null, 2)}</pre>
    </div>
  )
}
