-- ============================================================================
-- 0006_gems.sql — one AI action costs 3 gems; top-up packs; one-time gems reset
-- Run AFTER 0005. Safe to run once; the credit conversion is guarded by a flag
-- column so a second run cannot multiply balances again.
-- ============================================================================

-- 1. `ai_credits` is now counted in gems (30 = 10 actions), so the default and
--    the monthly allowances change. Free 30 / Plus 300 / Pro 900.
alter table public.profiles alter column ai_credits set default 30;

-- One-time marker for the actions→gems conversion below.
alter table public.profiles add column if not exists credits_in_gems boolean not null default false;

-- Convert existing monthly balances so nobody loses actions (10 → 30, 100 → 300).
update public.profiles
   set ai_credits = ai_credits * 3,
       credits_in_gems = true
 where credits_in_gems = false;

-- Old accounts accumulated gems from the earlier economy. Cap them at 30.
update public.profiles set gems = 30 where gems > 30;

-- 2. Top-up packs are sold as passes too.
alter table public.passes drop constraint if exists passes_plan_check;
alter table public.passes add constraint passes_plan_check
  check (plan in ('plus', 'pro', 'topup'));

-- 3. Debit 3 gems per AI action. Monthly allowance first, then top-up balance.
create or replace function public.consume_ai_credit(p_kind text default 'ai')
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  v_plan text;
  v_credits int;
  v_shots int;
  v_gems int;
  v_reset timestamptz;
  quota int;
  shot_quota int;
  cost int := 3;
begin
  if uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select plan, ai_credits, ai_shot_credits, credits_reset_at, coalesce(gems, 0)
    into v_plan, v_credits, v_shots, v_reset, v_gems
    from public.profiles where id = uid for update;
  if not found then
    raise exception 'NO_PROFILE';
  end if;

  -- Monthly reset when the window elapsed. Top-up gems are not touched.
  if v_reset is null or now() >= v_reset then
    if v_plan = 'pro' then
      quota := 900; shot_quota := -1;
    elsif v_plan = 'plus' then
      quota := 300; shot_quota := -1;
    else
      quota := 30; shot_quota := 5;
    end if;
    v_credits := quota;
    v_shots := shot_quota;
    update public.profiles
      set ai_credits = v_credits,
          ai_shot_credits = v_shots,
          credits_reset_at = date_trunc('month', now()) + interval '1 month'
      where id = uid;
  end if;

  if p_kind = 'shot' and v_shots = 0 then
    raise exception 'NO_SHOT_CREDITS';
  end if;

  if v_credits >= cost then
    v_credits := v_credits - cost;
  elsif v_gems >= cost then
    v_gems := v_gems - cost;
  else
    raise exception 'NO_CREDITS';
  end if;

  if p_kind = 'shot' and v_shots > 0 then
    v_shots := v_shots - 1;
  end if;

  update public.profiles
    set ai_credits = v_credits, ai_shot_credits = v_shots, gems = v_gems
    where id = uid;

  return jsonb_build_object('plan', v_plan, 'credits_left', v_credits + v_gems, 'shot_credits_left', v_shots);
end;
$function$;

-- 4. Applying a paid pass. A top-up adds 30 gems and leaves the plan alone; a
--    subscription sets the plan and its monthly allowance in gems.
create or replace function public.apply_paid_pass(p_pass_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pass   public.passes%rowtype;
  v_credits integer;
begin
  select * into v_pass from public.passes where id = p_pass_id for update;
  if not found then return false; end if;
  if v_pass.status <> 'paid' then return false; end if;

  if v_pass.plan = 'topup' then
    update public.profiles
       set gems = coalesce(gems, 0) + 30
     where id = v_pass.user_id;
    return true;
  end if;

  v_credits := case v_pass.plan when 'plus' then 300 when 'pro' then 900 else 30 end;

  update public.profiles
     set plan            = v_pass.plan,
         ai_credits      = v_credits,
         ai_shot_credits = -1,
         credits_reset_at = now() + interval '1 month'
   where id = v_pass.user_id;

  return true;
end;
$$;
