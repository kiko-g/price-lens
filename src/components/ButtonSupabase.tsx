import { createClient } from "@/lib/supabase/server"

export async function ButtonSupabase() {
  const supabase = createClient()
  const data = await supabase.from("products").select("*")
  console.debug(data)

  return (
    <>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  )
}
