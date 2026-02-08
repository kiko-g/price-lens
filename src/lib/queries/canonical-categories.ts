import { createClient } from "@/lib/supabase/server"
import { fetchAll } from "@/lib/supabase/fetch-all"
import type {
  CanonicalCategory,
  CategoryMapping,
  CategoryMappingStats,
  CreateCanonicalCategoryInput,
  CreateCategoryMappingInput,
  StoreCategoryTuple,
  UpdateCanonicalCategoryInput,
} from "@/types"

// ============================================================================
// Canonical Categories Queries
// ============================================================================

export const canonicalCategoryQueries = {
  /**
   * Get all canonical categories as a flat list
   */
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("canonical_categories")
      .select("*")
      .order("level", { ascending: true })
      .order("name", { ascending: true })

    return { data: data as CanonicalCategory[] | null, error }
  },

  /**
   * Get canonical categories as a hierarchical tree structure
   */
  async getTree(): Promise<{ data: CanonicalCategory[] | null; error: any }> {
    const supabase = createClient()
    const { data, error } = await supabase.from("canonical_categories").select("*").order("name", { ascending: true })

    if (error || !data) {
      return { data: null, error }
    }

    // Build tree structure
    const categoryMap = new Map<number, CanonicalCategory>()
    const roots: CanonicalCategory[] = []

    // First pass: create map of all categories
    for (const cat of data) {
      categoryMap.set(cat.id, { ...cat, children: [] } as CanonicalCategory)
    }

    // Second pass: build tree
    for (const cat of data) {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id === null) {
        roots.push(category)
      } else {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(category)
        }
      }
    }

    // Sort children at each level
    const sortChildren = (categories: CanonicalCategory[]) => {
      categories.sort((a, b) => a.name.localeCompare(b.name))
      for (const cat of categories) {
        if (cat.children && cat.children.length > 0) {
          sortChildren(cat.children)
        }
      }
    }
    sortChildren(roots)

    return { data: roots, error: null }
  },

  /**
   * Get a single canonical category by ID
   */
  async getById(id: number) {
    const supabase = createClient()
    const { data, error } = await supabase.from("canonical_categories").select("*").eq("id", id).single()

    return { data: data as CanonicalCategory | null, error }
  },

  /**
   * Get canonical category with its full ancestry path
   */
  async getWithAncestry(id: number): Promise<{ data: CanonicalCategory[] | null; error: any }> {
    const supabase = createClient()

    // Get the category and walk up the tree
    const ancestry: CanonicalCategory[] = []
    let currentId: number | null = id

    while (currentId !== null) {
      const result = await supabase.from("canonical_categories").select("*").eq("id", currentId).single()

      if (result.error || !result.data) {
        return { data: null, error: result.error }
      }

      const category = result.data as CanonicalCategory
      ancestry.unshift(category)
      currentId = category.parent_id
    }

    return { data: ancestry, error: null }
  },

  /**
   * Create a new canonical category
   */
  async create(input: CreateCanonicalCategoryInput) {
    const supabase = createClient()

    // Validate level based on parent
    if (input.parent_id) {
      const { data: parent } = await supabase
        .from("canonical_categories")
        .select("level")
        .eq("id", input.parent_id)
        .single()

      if (parent && parent.level >= 3) {
        return { data: null, error: { message: "Cannot create child of level 3 category" } }
      }
      if (parent && input.level !== parent.level + 1) {
        return { data: null, error: { message: `Child level must be ${parent.level + 1}` } }
      }
    } else if (input.level !== 1) {
      return { data: null, error: { message: "Root categories must be level 1" } }
    }

    const { data, error } = await supabase
      .from("canonical_categories")
      .insert({
        name: input.name,
        parent_id: input.parent_id ?? null,
        level: input.level,
      })
      .select()
      .single()

    return { data: data as CanonicalCategory | null, error }
  },

  /**
   * Update a canonical category
   */
  async update(id: number, input: UpdateCanonicalCategoryInput) {
    const supabase = createClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) {
      updateData.name = input.name
    }

    if (input.parent_id !== undefined) {
      updateData.parent_id = input.parent_id
    }

    const { data, error } = await supabase
      .from("canonical_categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    return { data: data as CanonicalCategory | null, error }
  },

  /**
   * Delete a canonical category (cascades to children and mappings)
   */
  async delete(id: number) {
    const supabase = createClient()
    const { error } = await supabase.from("canonical_categories").delete().eq("id", id)

    return { error }
  },

  /**
   * Get children of a category
   */
  async getChildren(parentId: number | null) {
    const supabase = createClient()
    let query = supabase.from("canonical_categories").select("*").order("name", { ascending: true })

    if (parentId === null) {
      query = query.is("parent_id", null)
    } else {
      query = query.eq("parent_id", parentId)
    }

    const { data, error } = await query
    return { data: data as CanonicalCategory[] | null, error }
  },
}

// ============================================================================
// Category Mappings Queries
// ============================================================================

export const categoryMappingQueries = {
  /**
   * Get all mappings with optional filters
   */
  async getAll(filters?: { origin_id?: number; canonical_category_id?: number; limit?: number; offset?: number }) {
    const supabase = createClient()
    let query = supabase
      .from("category_mappings")
      .select("*, canonical_categories(*)")
      .order("origin_id", { ascending: true })
      .order("store_category", { ascending: true })

    if (filters?.origin_id) {
      query = query.eq("origin_id", filters.origin_id)
    }
    if (filters?.canonical_category_id) {
      query = query.eq("canonical_category_id", filters.canonical_category_id)
    }
    if (filters?.limit) {
      const offset = filters.offset ?? 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data, error } = await query

    // Transform to include nested canonical_category
    const mappings = data?.map((m) => ({
      ...m,
      canonical_category: m.canonical_categories,
      canonical_categories: undefined,
    })) as CategoryMapping[] | null

    return { data: mappings, error }
  },

  /**
   * Get a single mapping by ID
   */
  async getById(id: number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("category_mappings")
      .select("*, canonical_categories(*)")
      .eq("id", id)
      .single()

    if (data) {
      const mapping = {
        ...data,
        canonical_category: data.canonical_categories,
        canonical_categories: undefined,
      } as CategoryMapping
      return { data: mapping, error }
    }

    return { data: null, error }
  },

  /**
   * Create a single mapping
   */
  async create(input: CreateCategoryMappingInput) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("category_mappings")
      .insert({
        origin_id: input.origin_id,
        store_category: input.store_category,
        store_category_2: input.store_category_2 ?? null,
        store_category_3: input.store_category_3 ?? null,
        canonical_category_id: input.canonical_category_id,
      })
      .select("*, canonical_categories(*)")
      .single()

    if (data) {
      const mapping = {
        ...data,
        canonical_category: data.canonical_categories,
        canonical_categories: undefined,
      } as CategoryMapping
      return { data: mapping, error }
    }

    return { data: null, error }
  },

  /**
   * Create multiple mappings at once
   */
  async createBulk(inputs: CreateCategoryMappingInput[]) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("category_mappings")
      .insert(
        inputs.map((input) => ({
          origin_id: input.origin_id,
          store_category: input.store_category,
          store_category_2: input.store_category_2 ?? null,
          store_category_3: input.store_category_3 ?? null,
          canonical_category_id: input.canonical_category_id,
        })),
      )
      .select()

    return { data: data as CategoryMapping[] | null, error }
  },

  /**
   * Update a mapping
   */
  async update(id: number, canonical_category_id: number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("category_mappings")
      .update({
        canonical_category_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, canonical_categories(*)")
      .single()

    if (data) {
      const mapping = {
        ...data,
        canonical_category: data.canonical_categories,
        canonical_categories: undefined,
      } as CategoryMapping
      return { data: mapping, error }
    }

    return { data: null, error }
  },

  /**
   * Delete a mapping
   */
  async delete(id: number) {
    const supabase = createClient()
    const { error } = await supabase.from("category_mappings").delete().eq("id", id)

    return { error }
  },

  /**
   * Delete multiple mappings
   */
  async deleteBulk(ids: number[]) {
    const supabase = createClient()
    const { error } = await supabase.from("category_mappings").delete().in("id", ids)

    return { error }
  },

  /**
   * Get all unique store category tuples with mapping status
   * Uses PostgreSQL RPC function for database-level aggregation (avoids row limits)
   * Falls back to paginated direct queries if RPC is unavailable
   */
  async getStoreTuplesWithMappingStatus(filters?: {
    origin_id?: number
    mapped?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: StoreCategoryTuple[] | null; count: number; error: any }> {
    const supabase = createClient()

    // Try RPC function first (aggregates at database level)
    type RpcTuple = {
      origin_id: number
      store_category: string
      store_category_2: string | null
      store_category_3: string | null
      product_count: number
    }

    const { data: allTuples, error: rpcError } = await fetchAll(() =>
      supabase.rpc("get_distinct_store_category_tuples"),
    )

    if (rpcError) {
      console.warn("RPC get_distinct_store_category_tuples failed, using fallback:", rpcError.message)
      return this.getStoreTuplesWithMappingStatusFallback(filters)
    }

    const tuples = allTuples as RpcTuple[]

    // Get all mappings
    const { data: allMappings, error: mappingsError } = await fetchAll(() =>
      supabase.from("category_mappings").select("*"),
    )

    if (mappingsError) {
      return { data: null, count: 0, error: mappingsError }
    }

    const mappings = allMappings

    // Get supermarket names
    const { data: supermarkets } = await supabase.from("supermarkets").select("id, name")
    const supermarketMap = new Map(supermarkets?.map((s) => [s.id, s.name]) ?? [])

    // Create a mapping lookup
    const mappingLookup = new Map<string, CategoryMapping>()
    for (const m of mappings ?? []) {
      const key = `${m.origin_id}|${m.store_category}|${m.store_category_2 ?? ""}|${m.store_category_3 ?? ""}`
      mappingLookup.set(key, m as CategoryMapping)
    }

    // Combine tuples with mapping info
    let result: StoreCategoryTuple[] = (tuples ?? []).map((t) => {
      const key = `${t.origin_id}|${t.store_category}|${t.store_category_2 ?? ""}|${t.store_category_3 ?? ""}`
      const mapping = mappingLookup.get(key)
      return {
        origin_id: t.origin_id,
        origin_name: supermarketMap.get(t.origin_id) ?? undefined,
        store_category: t.store_category,
        store_category_2: t.store_category_2,
        store_category_3: t.store_category_3,
        product_count: Number(t.product_count), // BIGINT comes as string/number
        is_mapped: !!mapping,
        mapping_id: mapping?.id,
        canonical_category_id: mapping?.canonical_category_id,
      }
    })

    // Sort by origin, then category path
    result.sort((a, b) => {
      if (a.origin_id !== b.origin_id) return a.origin_id - b.origin_id
      if (a.store_category !== b.store_category) return a.store_category.localeCompare(b.store_category)
      const a2 = a.store_category_2 ?? ""
      const b2 = b.store_category_2 ?? ""
      if (a2 !== b2) return a2.localeCompare(b2)
      const a3 = a.store_category_3 ?? ""
      const b3 = b.store_category_3 ?? ""
      return a3.localeCompare(b3)
    })

    // Apply filters
    if (filters?.origin_id) {
      result = result.filter((t) => t.origin_id === filters.origin_id)
    }
    if (filters?.mapped !== undefined) {
      result = result.filter((t) => t.is_mapped === filters.mapped)
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.store_category.toLowerCase().includes(searchLower) ||
          t.store_category_2?.toLowerCase().includes(searchLower) ||
          t.store_category_3?.toLowerCase().includes(searchLower),
      )
    }

    const totalCount = result.length

    // Apply pagination
    if (filters?.limit) {
      const offset = filters.offset ?? 0
      result = result.slice(offset, offset + filters.limit)
    }

    return { data: result, count: totalCount, error: null }
  },

  /**
   * Fallback: Get tuples using paginated direct queries (when RPC unavailable)
   * Fetches all store_products in batches to avoid the 1000 row limit
   */
  async getStoreTuplesWithMappingStatusFallback(filters?: {
    origin_id?: number
    mapped?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: StoreCategoryTuple[] | null; count: number; error: any }> {
    const supabase = createClient()

    // Fetch all store products
    const { data: allProducts, error: productsError } = await fetchAll(() =>
      supabase
        .from("store_products")
        .select("origin_id, category, category_2, category_3")
        .not("category", "is", null),
    )

    if (productsError) {
      return { data: null, count: 0, error: productsError }
    }

    // Group by tuple and count products
    const tupleMap = new Map<
      string,
      { origin_id: number; category: string; category_2: string | null; category_3: string | null; count: number }
    >()
    for (const sp of allProducts) {
      if (!sp.category || !sp.origin_id) continue
      const key = `${sp.origin_id}|${sp.category}|${sp.category_2 ?? ""}|${sp.category_3 ?? ""}`
      const existing = tupleMap.get(key)
      if (existing) {
        existing.count++
      } else {
        tupleMap.set(key, {
          origin_id: sp.origin_id as number,
          category: sp.category as string,
          category_2: sp.category_2 as string | null,
          category_3: sp.category_3 as string | null,
          count: 1,
        })
      }
    }

    // Get all mappings
    const { data: allMappings, error: mappingsError } = await fetchAll(() =>
      supabase.from("category_mappings").select("*"),
    )

    if (mappingsError) {
      return { data: null, count: 0, error: mappingsError }
    }

    const mappings = allMappings

    // Get supermarket names
    const { data: supermarkets } = await supabase.from("supermarkets").select("id, name")
    const supermarketMap = new Map(supermarkets?.map((s) => [s.id, s.name]) ?? [])

    // Create a mapping lookup
    const mappingLookup = new Map<string, CategoryMapping>()
    for (const m of mappings ?? []) {
      const key = `${m.origin_id}|${m.store_category}|${m.store_category_2 ?? ""}|${m.store_category_3 ?? ""}`
      mappingLookup.set(key, m as CategoryMapping)
    }

    // Combine tuples with mapping info
    let result: StoreCategoryTuple[] = Array.from(tupleMap.values()).map((t) => {
      const key = `${t.origin_id}|${t.category}|${t.category_2 ?? ""}|${t.category_3 ?? ""}`
      const mapping = mappingLookup.get(key)
      return {
        origin_id: t.origin_id,
        origin_name: supermarketMap.get(t.origin_id) ?? undefined,
        store_category: t.category,
        store_category_2: t.category_2,
        store_category_3: t.category_3,
        product_count: t.count,
        is_mapped: !!mapping,
        mapping_id: mapping?.id,
        canonical_category_id: mapping?.canonical_category_id,
      }
    })

    // Sort by origin, then category path
    result.sort((a, b) => {
      if (a.origin_id !== b.origin_id) return a.origin_id - b.origin_id
      if (a.store_category !== b.store_category) return a.store_category.localeCompare(b.store_category)
      const a2 = a.store_category_2 ?? ""
      const b2 = b.store_category_2 ?? ""
      if (a2 !== b2) return a2.localeCompare(b2)
      const a3 = a.store_category_3 ?? ""
      const b3 = b.store_category_3 ?? ""
      return a3.localeCompare(b3)
    })

    // Apply filters
    if (filters?.origin_id) {
      result = result.filter((t) => t.origin_id === filters.origin_id)
    }
    if (filters?.mapped !== undefined) {
      result = result.filter((t) => t.is_mapped === filters.mapped)
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.store_category.toLowerCase().includes(searchLower) ||
          t.store_category_2?.toLowerCase().includes(searchLower) ||
          t.store_category_3?.toLowerCase().includes(searchLower),
      )
    }

    const totalCount = result.length

    // Apply pagination
    if (filters?.limit) {
      const offset = filters.offset ?? 0
      result = result.slice(offset, offset + filters.limit)
    }

    return { data: result, count: totalCount, error: null }
  },

  /**
   * Get mapping statistics per store
   * Uses PostgreSQL RPC function for database-level aggregation (avoids row limits)
   * Falls back to paginated direct queries if RPC is unavailable
   */
  async getStats(): Promise<{ data: CategoryMappingStats[] | null; error: any }> {
    const supabase = createClient()

    // Try RPC function first (aggregates at database level)
    const { data: stats, error: statsError } = await supabase.rpc("get_category_mapping_stats")

    // If RPC fails or returns empty, fall back to paginated direct queries
    if (statsError) {
      console.warn("RPC get_category_mapping_stats failed, using fallback:", statsError.message)
      return this.getStatsFallback()
    }

    // If RPC returns empty array, use fallback (RPC might have issues)
    if (!stats || (Array.isArray(stats) && stats.length === 0)) {
      console.warn("RPC get_category_mapping_stats returned empty, using fallback")
      return this.getStatsFallback()
    }

    // Transform RPC result to CategoryMappingStats format
    type RpcStats = {
      origin_id: number
      origin_name: string
      total_tuples: number
      mapped_tuples: number
      unmapped_tuples: number
      total_products: number
      mapped_products: number
      coverage_percentage: number | null
    }

    const result: CategoryMappingStats[] = ((stats as RpcStats[]) ?? [])
      .map((s) => ({
        origin_id: s.origin_id,
        origin_name: s.origin_name,
        total_tuples: Number(s.total_tuples), // BIGINT comes as string/number
        mapped_tuples: Number(s.mapped_tuples),
        unmapped_tuples: Number(s.unmapped_tuples),
        total_products: Number(s.total_products),
        mapped_products: Number(s.mapped_products),
        coverage_percentage: Number(s.coverage_percentage ?? 0),
      }))
      .sort((a, b) => a.origin_id - b.origin_id)

    return { data: result, error: null }
  },

  /**
   * Fallback: Get stats using paginated direct queries (when RPC unavailable)
   */
  async getStatsFallback(): Promise<{ data: CategoryMappingStats[] | null; error: any }> {
    const supabase = createClient()

    // Fetch all store products
    const { data: allProducts, error: productsError } = await fetchAll(() =>
      supabase
        .from("store_products")
        .select("origin_id, category, category_2, category_3")
        .not("category", "is", null),
    )

    if (productsError) {
      return { data: null, error: productsError }
    }

    // Get all mappings
    const { data: allMappings, error: mappingsError } = await fetchAll(() =>
      supabase.from("category_mappings").select("*"),
    )

    if (mappingsError) {
      return { data: null, error: mappingsError }
    }

    const mappings = allMappings

    // Get supermarket names
    const { data: supermarkets } = await supabase.from("supermarkets").select("id, name")
    const supermarketMap = new Map(supermarkets?.map((s) => [s.id, s.name]) ?? [])

    // Create mapping lookup
    const mappingLookup = new Set<string>()
    for (const m of mappings ?? []) {
      const key = `${m.origin_id}|${m.store_category}|${m.store_category_2 ?? ""}|${m.store_category_3 ?? ""}`
      mappingLookup.add(key)
    }

    // Calculate stats per origin
    const statsMap = new Map<
      number,
      {
        origin_id: number
        total_tuples: Set<string>
        mapped_tuples: Set<string>
        total_products: number
        mapped_products: number
      }
    >()

    for (const sp of allProducts) {
      if (!sp.category || !sp.origin_id) continue

      const tupleKey = `${sp.category}|${sp.category_2 ?? ""}|${sp.category_3 ?? ""}`
      const mappingKey = `${sp.origin_id}|${sp.category}|${sp.category_2 ?? ""}|${sp.category_3 ?? ""}`
      const isMapped = mappingLookup.has(mappingKey)

      let stats = statsMap.get(sp.origin_id)
      if (!stats) {
        stats = {
          origin_id: sp.origin_id,
          total_tuples: new Set(),
          mapped_tuples: new Set(),
          total_products: 0,
          mapped_products: 0,
        }
        statsMap.set(sp.origin_id, stats)
      }

      stats.total_tuples.add(tupleKey)
      stats.total_products++

      if (isMapped) {
        stats.mapped_tuples.add(tupleKey)
        stats.mapped_products++
      }
    }

    // Convert to final format
    const result: CategoryMappingStats[] = Array.from(statsMap.values())
      .map((s) => ({
        origin_id: s.origin_id,
        origin_name: supermarketMap.get(s.origin_id) ?? `Store ${s.origin_id}`,
        total_tuples: s.total_tuples.size,
        mapped_tuples: s.mapped_tuples.size,
        unmapped_tuples: s.total_tuples.size - s.mapped_tuples.size,
        total_products: s.total_products,
        mapped_products: s.mapped_products,
        coverage_percentage:
          s.total_products > 0 ? Math.round((s.mapped_products / s.total_products) * 10000) / 100 : 0,
      }))
      .sort((a, b) => a.origin_id - b.origin_id)

    return { data: result, error: null }
  },

  /**
   * Get overall stats summary
   */
  async getOverallStats(): Promise<{
    data: {
      total_canonical_categories: number
      total_mappings: number
      stores: CategoryMappingStats[]
    } | null
    error: any
  }> {
    const supabase = createClient()

    const [categoriesResult, mappingsResult, statsResult] = await Promise.all([
      supabase.from("canonical_categories").select("id", { count: "exact", head: true }),
      supabase.from("category_mappings").select("id", { count: "exact", head: true }),
      this.getStats(),
    ])

    if (statsResult.error) {
      return { data: null, error: statsResult.error }
    }

    return {
      data: {
        total_canonical_categories: categoriesResult.count ?? 0,
        total_mappings: mappingsResult.count ?? 0,
        stores: statsResult.data ?? [],
      },
      error: null,
    }
  },
}
