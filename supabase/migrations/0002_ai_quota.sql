-- ============================================================================
-- 0002_ai_quota.sql — Server-side AI action quota (T2)
-- Free 10 / Plus 100 / Pro 300 AI actions per month; free screenshots capped at 5.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS ai_credits integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  ADD COLUMN IF NOT EXISTS ai_shot_credits integer NOT NULL DEFAULT 5;

-- Atomic, server-authoritative debit. Derives the user from auth.uid() (never a
-- client-supplied id), locks the profile row, resets the monthly window when
-- elapsed, and refuses when the quota is exhausted.
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_kind text DEFAULT 'ai')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  v_plan text;
  v_credits int;
  v_shots int;
  v_reset timestamptz;
  quota int;
  shot_quota int;
begin
  if uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select plan, ai_credits, ai_shot_credits, credits_reset_at
    into v_plan, v_credits, v_shots, v_reset
    from public.profiles where id = uid for update;
  if not found then
    raise exception 'NO_PROFILE';
  end if;

  -- Monthly reset when the window elapsed.
  if v_reset is null or now() >= v_reset then
    if v_plan = 'pro' then
      quota := 300; shot_quota := -1;
    elsif v_plan = 'plus' then
      quota := 100; shot_quota := -1;
    else
      quota := 10; shot_quota := 5;
    end if;
    v_credits := quota;
    v_shots := shot_quota;
    update public.profiles
      set ai_credits = v_credits,
          ai_shot_credits = v_shots,
          credits_reset_at = date_trunc('month', now()) + interval '1 month'
      where id = uid;
  end if;

  if v_credits <= 0 then
    raise exception 'NO_CREDITS';
  end if;
  if p_kind = 'shot' and v_shots = 0 then
    raise exception 'NO_SHOT_CREDITS';
  end if;

  v_credits := v_credits - 1;
  if p_kind = 'shot' and v_shots > 0 then
    v_shots := v_shots - 1;
  end if;

  update public.profiles
    set ai_credits = v_credits, ai_shot_credits = v_shots
    where id = uid;

  return jsonb_build_object('plan', v_plan, 'credits_left', v_credits, 'shot_credits_left', v_shots);
end;
$function$;
