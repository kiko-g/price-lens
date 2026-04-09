-- Shopping Lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My List',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Shopping List Items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id bigint NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  store_product_id bigint NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(list_id, store_product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON public.shopping_list_items(list_id);

-- RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shopping lists"
  ON public.shopping_lists
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage items in their own lists"
  ON public.shopping_list_items
  FOR ALL
  USING (
    list_id IN (SELECT id FROM public.shopping_lists WHERE user_id = auth.uid())
  )
  WITH CHECK (
    list_id IN (SELECT id FROM public.shopping_lists WHERE user_id = auth.uid())
  );
