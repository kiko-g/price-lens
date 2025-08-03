export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      prices: {
        Row: {
          created_at: string
          discount: number | null
          id: number
          price: number | null
          price_per_major_unit: number | null
          price_recommended: number | null
          store_product_id: number
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
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_store_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          id: number
          name: string | null
          product_ref_ids: number[] | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          id: number
          name?: string | null
          product_ref_ids?: number[] | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          id?: number
          name?: string | null
          product_ref_ids?: number[] | null
        }
        Relationships: []
      }
      scrape_jobs: {
        Row: {
          id: number
          is_done: boolean | null
          last_update: string | null
          next_page: number
        }
        Insert: {
          id?: number
          is_done?: boolean | null
          last_update?: string | null
          next_page?: number
        }
        Update: {
          id?: number
          is_done?: boolean | null
          last_update?: string | null
          next_page?: number
        }
        Relationships: []
      }
      store_products: {
        Row: {
          brand: string | null
          category: string | null
          category_2: string | null
          category_3: string | null
          created_at: string | null
          discount: number | null
          id: number
          image: string | null
          major_unit: string | null
          name: string | null
          origin_id: number | null
          pack: string | null
          price: number | null
          price_per_major_unit: number | null
          price_recommended: number | null
          priority: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          category_2?: string | null
          category_3?: string | null
          created_at?: string | null
          discount?: number | null
          id?: number
          image?: string | null
          major_unit?: string | null
          name?: string | null
          origin_id?: number | null
          pack?: string | null
          price?: number | null
          price_per_major_unit?: number | null
          price_recommended?: number | null
          priority?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          category_2?: string | null
          category_3?: string | null
          created_at?: string | null
          discount?: number | null
          id?: number
          image?: string | null
          major_unit?: string | null
          name?: string | null
          origin_id?: number | null
          pack?: string | null
          price?: number | null
          price_per_major_unit?: number | null
          price_recommended?: number | null
          priority?: number | null
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
      user_favorites: {
        Row: {
          id: number
          user_id: string
          store_product_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          store_product_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          store_product_id?: number
          created_at?: string
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
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      unaccent: {
        Args: {
          "": string
        }
        Returns: string
      }
      unaccent_init: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
