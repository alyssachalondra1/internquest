-- ============================================================================
-- 0004_group_limits.sql — plan-based group create/join limits (T5)
-- Free: 2 create / 10 join · Plus: 10 / 30 · Pro: unlimited
-- ============================================================================

CREATE OR REPLACE FUNCTION public.group_plan_limits(p_user uuid)
 RETURNS TABLE(create_limit int, join_limit int)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_plan text;
begin
  select p.plan into v_plan from public.profiles p where p.id = p_user;
  if v_plan = 'pro' then
    return query select -1, -1;          -- -1 = unlimited
  elsif v_plan = 'plus' then
    return query select 10, 30;
  else
    return query select 2, 10;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_group(p_name text)
 RETURNS study_groups
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g public.study_groups; code text; tries int := 0; uid uuid := auth.uid(); cl int; cnt int;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select count(*) into cnt from study_groups where owner_id = uid;
  select create_limit into cl from public.group_plan_limits(uid);
  if cl >= 0 and cnt >= cl then
    raise exception 'GROUP_CREATE_LIMIT: your plan allows % groups', cl;
  end if;

  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into study_groups (name, join_code, owner_id) values (p_name, code, uid) returning * into g;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 6 then raise; end if;
    end;
  end loop;
  insert into group_members (group_id, user_id) values (g.id, uid) on conflict do nothing;
  return g;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare gid uuid; uid uuid := auth.uid(); jl int; cnt int; already boolean;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select id into gid from study_groups where join_code = upper(p_code);
  if gid is null then raise exception 'Group not found'; end if;

  select exists(select 1 from group_members where group_id = gid and user_id = uid) into already;
  if already then
    return gid;   -- already a member: no new slot consumed
  end if;

  select count(*) into cnt from group_members where user_id = uid;
  select join_limit into jl from public.group_plan_limits(uid);
  if jl >= 0 and cnt >= jl then
    raise exception 'GROUP_JOIN_LIMIT: your plan allows joining % groups', jl;
  end if;

  insert into group_members (group_id, user_id) values (gid, uid) on conflict (group_id, user_id) do nothing;
  return gid;
end;
$function$;
