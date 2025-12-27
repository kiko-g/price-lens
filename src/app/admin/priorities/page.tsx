import { storeProductQueries } from "@/lib/db/queries/products"
import { AdminPrioritiesGrid } from "@/components/admin/AdminPrioritiesGrid"

type Props = {
  searchParams: Promise<{
    page?: string
    q?: string
    priority?: string
  }>
}

export default async function AdminPrioritiesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const query = params.q || ""
  const priorityFilter = params.priority || "all"
  const limit = 48

  let result
  if (priorityFilter === "null") {
    result = await storeProductQueries.getAllNullPriority({
      offset: (page - 1) * limit,
      limit,
      excludeRecentlyClassified: false,
      excludeManual: false,
    })
  } else if (priorityFilter === "all") {
    result = await storeProductQueries.getAll({
      page,
      limit,
      query,
      nonNulls: true,
      sort: "a-z",
    })
  } else {
    const priority = parseInt(priorityFilter)
    result = await storeProductQueries.getAllByPriority(priority, {
      offset: (page - 1) * limit,
      limit,
      excludeRecentlyClassified: false,
      recentThresholdDays: 30,
      excludeManual: false,
    })
  }

  const products = result?.data || []
  const totalCount = result?.count || 0
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <AdminPrioritiesGrid
      initialData={{
        products,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      }}
      initPage={page}
      initQuery={query}
      initPriorityFilter={priorityFilter}
    />
  )
}

