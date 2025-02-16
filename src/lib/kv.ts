import { kv } from "@vercel/kv"

export async function getLastProcessedId(): Promise<number> {
  const id = await kv.get<number>("lastProcessedProductId")
  return id ?? 0
}

export async function setLastProcessedId(id: number): Promise<void> {
  await kv.set("lastProcessedProductId", id)
}
