export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          id: number
          is_generic: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: number
          is_generic?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: number
          is_generic?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
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
      store_products: {
        Row: {
          barcode: string | null
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
          priority_source: Database["public"]["Enums"]["priority_source_type"] | null
          priority_updated_at: string | null
          product_id: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          barcode?: string | null
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
          priority_source?: Database["public"]["Enums"]["priority_source_type"] | null
          priority_updated_at?: string | null
          product_id?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          barcode?: string | null
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
          priority_source?: Database["public"]["Enums"]["priority_source_type"] | null
          priority_updated_at?: string | null
          product_id?: number | null
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
            foreignKeyName: "store_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unsynced_high_priority_products: {
        Args: never
        Returns: {
          barcode: string | null
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
          priority_source: Database["public"]["Enums"]["priority_source_type"] | null
          priority_updated_at: string | null
          product_id: number | null
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      plan_tier: "free" | "plus"
      priority_source_type: "ai" | "manual"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
  public: {
    Enums: {
      plan_tier: ["free", "plus"],
      priority_source_type: ["ai", "manual"],
      user_role: ["user", "admin"],
    },
  },
} as const
