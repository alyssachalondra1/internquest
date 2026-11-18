-- ============================================================================
-- 0003_ai_usage.sql — Per-call AI token & cost audit (T4)
-- Records prompt/completion tokens and estimated IDR cost for every AI action,
-- so OpenRouter spend is observable. Uses its own table (not ai_generations) to
-- avoid inflating the AI-generation count used by the "Active AI User" badge.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,                 -- 'generate' | 'extract' | 'cv' | 'match' | 'shot'
  model text,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  cost_idr numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON public.ai_usage (user_id, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai usage" ON public.ai_usage
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
