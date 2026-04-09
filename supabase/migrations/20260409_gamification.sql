-- User Achievements / Badges
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- User Activity Log (for streak tracking)
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_type, activity_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_date ON public.user_activity_log(user_id, activity_date);

-- RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own activity"
  ON public.user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activity"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (true);
