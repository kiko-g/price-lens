-- Price Alert Subscriptions
CREATE TABLE IF NOT EXISTS public.price_alert_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_product_id bigint NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  threshold_type text NOT NULL DEFAULT 'any_drop' CHECK (threshold_type IN ('any_drop', 'percentage', 'target_price')),
  threshold_value numeric, -- percentage (e.g. 0.10 = 10%) or target price in EUR
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_product_id)
);

-- Alert Events (triggered notifications log)
CREATE TABLE IF NOT EXISTS public.alert_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subscription_id bigint NOT NULL REFERENCES public.price_alert_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_product_id bigint NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  price_change_pct numeric NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'in_app')),
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_alert_subs_user ON public.price_alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alert_subs_product ON public.price_alert_subscriptions(store_product_id);
CREATE INDEX IF NOT EXISTS idx_price_alert_subs_active ON public.price_alert_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_events_user ON public.alert_events(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_sub ON public.alert_events(subscription_id);

-- RLS
ALTER TABLE public.price_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert subscriptions"
  ON public.price_alert_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own alert events"
  ON public.alert_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert alert events (from cron)
CREATE POLICY "Service role can insert alert events"
  ON public.alert_events
  FOR INSERT
  WITH CHECK (true);
