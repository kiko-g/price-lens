/**
 * Client-safe surface: no `next/headers` or server Supabase.
 * - Route Handlers and Server Components: import `queryDealsFeed` from `@/lib/queries/deals-feed`.
 */
export { DEFAULT_DEALS_PAGE_LIMIT, MAX_DEALS_PAGE_LIMIT } from "./deals-constants"
export type { DealsFeedPagination, DealsFeedResult, QueryDealsFeedParams } from "./deals-feed.types"
