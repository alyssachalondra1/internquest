-- 0005_passes.sql
-- Paid passes (monthly plan purchases) and the Midtrans transaction record.
-- One row per checkout attempt. The webhook is the only writer of `status`
-- after creation, so the browser can never mark a pass as paid.

create table if not exists public.passes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  plan                text not null check (plan in ('plus', 'pro')),
  amount              integer not null,                 -- rupiah, integer (no cents)
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  order_id            text not null unique,             -- our id, sent to Midtrans
  midtrans_id         text,                             -- transaction_id from Midtrans
  payment_type        text,                             -- qris, gopay, bank_transfer, ...
  qr_url              text,
  expires_at          timestamptz,
  paid_at             timestamptz,
  raw_status          text,                             -- last status payload seen
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists passes_user_idx    on public.passes (user_id, created_at desc);
create index if not exists passes_status_idx  on public.passes (status);
create index if not exists passes_order_idx   on public.passes (order_id);

alter table public.passes enable row level security;

-- A user can read their own passes. Nothing else: writes go through the
-- service role in the server action and the webhook.
drop policy if exists "passes_select_own" on public.passes;
create policy "passes_select_own"
  on public.passes for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy on purpose. Anon and authenticated clients
-- cannot create or mutate a pass, so a forged "paid" row is impossible.

create or replace function public.touch_passes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists passes_touch_updated_at on public.passes;
create trigger passes_touch_updated_at
  before update on public.passes
  for each row execute function public.touch_passes_updated_at();

-- Applies a paid pass to the profile: sets the plan, tops the AI credits up to
-- the plan's monthly allowance and pushes the reset date one month out.
-- Called by the webhook only. Idempotent: a repeated call for the same pass
-- does not stack credits.
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

  v_credits := case v_pass.plan when 'plus' then 100 when 'pro' then 300 else 10 end;

  update public.profiles
     set plan            = v_pass.plan,
         ai_credits      = v_credits,
         ai_shot_credits = -1,
         credits_reset_at = now() + interval '1 month'
   where id = v_pass.user_id;

  return true;
end;
$$;

revoke all on function public.apply_paid_pass(uuid) from public, anon, authenticated;
