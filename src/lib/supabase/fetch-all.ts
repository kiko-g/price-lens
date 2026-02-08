import { PostgrestError } from "@supabase/supabase-js"

const DEFAULT_PAGE_SIZE = 1000
const DEFAULT_MAX_PAGES = 100

/**
 * Fetches all rows from a Supabase query, paginating internally to avoid the
 * default 1000-row server limit. Accepts a query factory function (not a query
 * instance) because Supabase query builders are mutable.
 *
 * @example
 * const { data, error } = await fetchAll(() =>
 *   supabase.from("store_products").select("id, priority").gte("updated_at", cutoff)
 * )
 */
export async function fetchAll<T extends Record<string, unknown>>(
  queryFactory: () => { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }> },
  options?: { pageSize?: number; maxPages?: number },
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES
  const allData: T[] = []
  let offset = 0

  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await queryFactory().range(offset, offset + pageSize - 1)

    if (error) return { data: allData, error }
    if (!data || data.length === 0) break

    allData.push(...data)

    if (data.length < pageSize) break
    offset += pageSize
  }

  return { data: allData, error: null }
}
