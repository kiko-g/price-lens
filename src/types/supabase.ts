export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_snapshots: {
        Row: {
          computed_at: string
          data: Json
          duration_ms: number | null
          id: number
          triggered_by: string
        }
        Insert: {
          computed_at?: string
          data: Json
          duration_ms?: number | null
          id?: never
          triggered_by?: string
        }
        Update: {
          computed_at?: string
          data?: Json
          duration_ms?: number | null
          id?: never
          triggered_by?: string
        }
        Relationships: []
      }
      canonical_categories: {
        Row: {
          created_at: string | null
          default_priority: number
          id: number
          level: number
          name: string
          parent_id: number | null
          tracked: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_priority?: number
          id?: number
          level: number
          name: string
          parent_id?: number | null
          tracked?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_priority?: number
          id?: number
          level?: number
          name?: string
          parent_id?: number | null
          tracked?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "canonical_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_products: {
        Row: {
          barcode_count: number
          brand: string | null
          created_at: string
          id: number
          name: string
          source: string
          store_count: number
          updated_at: string
          volume_unit: string | null
          volume_value: number | null
        }
        Insert: {
          barcode_count?: number
          brand?: string | null
          created_at?: string
          id?: number
          name: string
          source?: string
          store_count?: number
          updated_at?: string
          volume_unit?: string | null
          volume_value?: number | null
        }
        Update: {
          barcode_count?: number
          brand?: string | null
          created_at?: string
          id?: number
          name?: string
          source?: string
          store_count?: number
          updated_at?: string
          volume_unit?: string | null
          volume_value?: number | null
        }
        Relationships: []
      }
      category_mappings: {
        Row: {
          canonical_category_id: number
          created_at: string | null
          id: number
          origin_id: number
          store_category: string
          store_category_2: string | null
          store_category_3: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_category_id: number
          created_at?: string | null
          id?: number
          origin_id: number
          store_category: string
          store_category_2?: string | null
          store_category_3?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_category_id?: number
          created_at?: string | null
          id?: number
          origin_id?: number
          store_category?: string
          store_category_2?: string | null
          store_category_3?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_mappings_canonical_category_id_fkey"
            columns: ["canonical_category_id"]
            isOneToOne: false
            referencedRelation: "canonical_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_mappings_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          discovery_source: string
          errors: Json | null
          id: number
          metadata: Json | null
          origin_id: number
          started_at: string
          status: string
          urls_existing: number
          urls_found: number
          urls_invalid: number
          urls_new: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          discovery_source: string
          errors?: Json | null
          id?: number
          metadata?: Json | null
          origin_id: number
          started_at?: string
          status: string
          urls_existing?: number
          urls_found?: number
          urls_invalid?: number
          urls_new?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          discovery_source?: string
          errors?: Json | null
          id?: number
          metadata?: Json | null
          origin_id?: number
          started_at?: string
          status?: string
          urls_existing?: number
          urls_found?: number
          urls_invalid?: number
          urls_new?: number
        }
        Relationships: [
          {
            foreignKeyName: "discovery_runs_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          created_at: string
          discount: number | null
          id: number
          price: number | null
          price_per_major_unit: number | null
          price_recommended: number | null
          store_product_id: number
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: number
          price?: number | null
          price_per_major_unit?: number | null
          price_recommended?: number | null
          store_product_id: number
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: number
          price?: number | null
          price_per_major_unit?: number | null
          price_recommended?: number | null
          store_product_id?: number
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_supermarket_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_supermarket_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products_with_canonical"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      scrape_runs: {
        Row: {
          avg_duration_ms: number | null
          batch_id: string
          duration_ms: number | null
          error: string | null
          failed: number
          finished_at: string | null
          id: number
          started_at: string
          success: number
          total: number
        }
        Insert: {
          avg_duration_ms?: number | null
          batch_id: string
          duration_ms?: number | null
          error?: string | null
          failed?: number
          finished_at?: string | null
          id?: number
          started_at?: string
          success?: number
          total?: number
        }
        Update: {
          avg_duration_ms?: number | null
          batch_id?: string
          duration_ms?: number | null
          error?: string | null
          failed?: number
          finished_at?: string | null
          id?: number
          started_at?: string
          success?: number
          total?: number
        }
        Relationships: []
      }
      store_products: {
        Row: {
          available: boolean
          barcode: string | null
          brand: string | null
          canonical_product_id: number | null
          category: string | null
          category_2: string | null
          category_3: string | null
          created_at: string | null
          discount: number | null
          id: number
          image: string | null
          last_http_status: number | null
          major_unit: string | null
          name: string | null
          origin_id: number | null
          pack: string | null
          price: number | null
          price_per_major_unit: number | null
          price_recommended: number | null
          priority: number | null
          priority_source:
            | Database["public"]["Enums"]["priority_source_type"]
            | null
          priority_updated_at: string | null
          scraped_at: string | null
          trade_item_id: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          available?: boolean
          barcode?: string | null
          brand?: string | null
          canonical_product_id?: number | null
          category?: string | null
          category_2?: string | null
          category_3?: string | null
          created_at?: string | null
          discount?: number | null
          id?: number
          image?: string | null
          last_http_status?: number | null
          major_unit?: string | null
          name?: string | null
          origin_id?: number | null
          pack?: string | null
          price?: number | null
          price_per_major_unit?: number | null
          price_recommended?: number | null
          priority?: number | null
          priority_source?:
            | Database["public"]["Enums"]["priority_source_type"]
            | null
          priority_updated_at?: string | null
          scraped_at?: string | null
          trade_item_id?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          available?: boolean
          barcode?: string | null
          brand?: string | null
          canonical_product_id?: number | null
          category?: string | null
          category_2?: string | null
          category_3?: string | null
          created_at?: string | null
          discount?: number | null
          id?: number
          image?: string | null
          last_http_status?: number | null
          major_unit?: string | null
          name?: string | null
          origin_id?: number | null
          pack?: string | null
          price?: number | null
          price_per_major_unit?: number | null
          price_recommended?: number | null
          priority?: number | null
          priority_source?:
            | Database["public"]["Enums"]["priority_source_type"]
            | null
          priority_updated_at?: string | null
          scraped_at?: string | null
          trade_item_id?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_canonical_product_id_fkey"
            columns: ["canonical_product_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_trade_item_id_fkey"
            columns: ["trade_item_id"]
            isOneToOne: false
            referencedRelation: "trade_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supermarkets: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id?: never
          name?: string | null
        }
        Update: {
          id?: never
          name?: string | null
        }
        Relationships: []
      }
      trade_items: {
        Row: {
          canonical_product_id: number | null
          created_at: string
          gs1_prefix: string | null
          gtin: string
          gtin_format: string
          id: number
          off_product_name: string | null
          source: string
          updated_at: string
        }
        Insert: {
          canonical_product_id?: number | null
          created_at?: string
          gs1_prefix?: string | null
          gtin: string
          gtin_format: string
          id?: number
          off_product_name?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          canonical_product_id?: number | null
          created_at?: string
          gs1_prefix?: string | null
          gtin?: string
          gtin_format?: string
          id?: number
          off_product_name?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_canonical_product_id_fkey"
            columns: ["canonical_product_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: number
          store_product_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          store_product_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          store_product_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_store_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_store_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products_with_canonical"
            referencedColumns: ["id"]
          },
        ]
      }
      vetoed_store_skus: {
        Row: {
          origin_id: number
          sku: string
          store_category: string | null
          vetoed_at: string
        }
        Insert: {
          origin_id: number
          sku: string
          store_category?: string | null
          vetoed_at?: string
        }
        Update: {
          origin_id?: number
          sku?: string
          store_category?: string | null
          vetoed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vetoed_store_skus_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      store_products_with_canonical: {
        Row: {
          available: boolean | null
          barcode: string | null
          brand: string | null
          canonical_category_id: number | null
          canonical_category_name: string | null
          canonical_category_name_2: string | null
          canonical_category_name_3: string | null
          canonical_level: number | null
          canonical_parent_id: number | null
          canonical_parent_id_2: number | null
          category: string | null
          category_2: string | null
          category_3: string | null
          created_at: string | null
          discount: number | null
          id: number | null
          image: string | null
          major_unit: string | null
          name: string | null
          origin_id: number | null
          pack: string | null
          price: number | null
          price_per_major_unit: number | null
          price_recommended: number | null
          priority: number | null
          priority_source:
            | Database["public"]["Enums"]["priority_source_type"]
            | null
          priority_updated_at: string | null
          scraped_at: string | null
          updated_at: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_categories_parent_id_fkey"
            columns: ["canonical_parent_id"]
            isOneToOne: false
            referencedRelation: "canonical_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_categories_parent_id_fkey"
            columns: ["canonical_parent_id_2"]
            isOneToOne: false
            referencedRelation: "canonical_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_mappings_canonical_category_id_fkey"
            columns: ["canonical_category_id"]
            isOneToOne: false
            referencedRelation: "canonical_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bulk_link_trade_items: {
        Args: { cp_ids: number[]; ti_ids: number[] }
        Returns: number
      }
      compute_analytics_snapshot: {
        Args: { p_triggered_by?: string }
        Returns: Json
      }
      count_canonical_products: {
        Args: {
          min_barcodes?: number
          min_stores?: number
          search_term?: string
        }
        Returns: number
      }
      count_orphan_trade_items: {
        Args: { search_term?: string }
        Returns: number
      }
      count_orphaned_canonicals: { Args: never; Returns: number }
      count_phantom_scraped_products: {
        Args: { active_priorities: number[] }
        Returns: number
      }
      delete_canonical_product: {
        Args: { target_id: number }
        Returns: undefined
      }
      denormalize_canonical_ids: { Args: never; Returns: number }
      denormalize_canonical_ids_batch: {
        Args: { batch_size?: number }
        Returns: number
      }
      get_activity_window_stats: { Args: never; Returns: Json }
      get_admin_overview_stats: { Args: never; Returns: Json }
      get_category_mapping_stats: {
        Args: never
        Returns: {
          coverage_percentage: number
          mapped_products: number
          mapped_tuples: number
          origin_id: number
          origin_name: string
          total_products: number
          total_tuples: number
          unmapped_tuples: number
        }[]
      }
      get_distinct_categories: {
        Args: never
        Returns: {
          category: string
          category_2: string
          category_3: string
        }[]
      }
      get_distinct_store_category_tuples: {
        Args: never
        Returns: {
          origin_id: number
          product_count: number
          store_category: string
          store_category_2: string
          store_category_3: string
        }[]
      }
      get_orphan_trade_items: {
        Args: {
          result_limit?: number
          result_offset?: number
          search_term?: string
        }
        Returns: {
          canonical_brand: string
          canonical_name: string
          canonical_product_id: number
          gs1_prefix: string
          gtin: string
          off_product_name: string
          trade_item_id: number
        }[]
      }
      get_phantom_scraped_products: {
        Args: { active_priorities: number[]; max_results?: number }
        Returns: {
          id: number
          name: string
          priority: number
          updated_at: string
        }[]
      }
      get_schedule_stats: {
        Args: { priority_refresh_hours?: Json }
        Returns: {
          fresh: number
          never_scraped: number
          priority: number
          stale_actionable: number
          staleness_threshold_hours: number
          total: number
          unavailable: number
        }[]
      }
      get_unsynced_high_priority_products: {
        Args: never
        Returns: {
          available: boolean
          barcode: string | null
          brand: string | null
          canonical_product_id: number | null
          category: string | null
          category_2: string | null
          category_3: string | null
          created_at: string | null
          discount: number | null
          id: number
          image: string | null
          last_http_status: number | null
          major_unit: string | null
          name: string | null
          origin_id: number | null
          pack: string | null
          price: number | null
          price_per_major_unit: number | null
          price_recommended: number | null
          priority: number | null
          priority_source:
            | Database["public"]["Enums"]["priority_source_type"]
            | null
          priority_updated_at: string | null
          scraped_at: string | null
          trade_item_id: number | null
          updated_at: string | null
          url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "store_products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_canonical_products: {
        Args: {
          min_barcodes?: number
          min_stores?: number
          result_limit?: number
          result_offset?: number
          search_term?: string
        }
        Returns: {
          barcodes: number
          brand: string
          canonical_id: number
          name: string
          source: string
          stores: number
        }[]
      }
      refresh_canonical_counts_batch: {
        Args: { batch_size?: number }
        Returns: number
      }
      resolve_category_governance: {
        Args: {
          p_category: string
          p_category_2?: string
          p_category_3?: string
          p_origin_id: number
        }
        Returns: {
          canonical_category_id: number
          canonical_category_name: string
          default_priority: number
          tracked: boolean
        }[]
      }
      search_canonical_products: {
        Args: { result_limit?: number; search_term: string }
        Returns: {
          barcode_count: number
          brand: string
          id: number
          name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_price_point: {
        Args: {
          p_discount: number
          p_price: number
          p_price_per_major_unit: number
          p_price_recommended: number
          p_store_product_id: number
          p_timestamp?: string
        }
        Returns: Json
      }
    }
    Enums: {
      plan_tier: "free" | "plus"
      priority_source_type: "ai" | "manual" | "category_default" | "unmapped"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      plan_tier: ["free", "plus"],
      priority_source_type: ["ai", "manual", "category_default", "unmapped"],
      user_role: ["user", "admin"],
    },
  },
} as const

