import { createClient } from "@/lib/supabase/server"

export async function ButtonSupabase() {
  const supabase = createClient()
  const { data: products } = await supabase.from("products").select("*")

  return <div className="max-w-md p-4"></div>
}
