-- ============================================================================
-- 0001_init.sql — Initial Schema Migration for Sloe (Internquest)
-- ============================================================================

-- 1. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  cv_url text,
  cv_text text,
  portfolio_url text,
  portfolio_text text,
  interests text,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  gems integer NOT NULL DEFAULT 0,
  streak_count integer NOT NULL DEFAULT 0,
  last_active_date date,
  last_seen_achievements text[] NOT NULL DEFAULT '{}'::text[],
  awarded_achievements jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  xp_reward integer NOT NULL DEFAULT 0,
  icon text
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  role text,
  location text,
  work_type text,
  is_paid boolean,
  duration_months integer,
  open_date date,
  deadline date,
  deadline_type text NOT NULL DEFAULT 'date'::text,
  start_date date,
  timing_note text,
  status text NOT NULL DEFAULT 'todo'::text,
  poster_url text,
  source_url text,
  notes text,
  match_score integer,
  match_reasons text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  internship_id uuid REFERENCES public.internships(id) ON DELETE SET NULL,
  answer_type text NOT NULL DEFAULT 'motivation_letter'::text,
  tone text,
  length text,
  content text,
  model text DEFAULT 'gemini-3.1-flash-lite'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 20,
  is_done boolean NOT NULL DEFAULT false,
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  role text,
  location text,
  duration_months integer,
  open_date date,
  deadline date,
  start_date date,
  source_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  rating integer NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 3. FUNCTIONS & RPCs
CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from group_members m where m.group_id = gid and m.user_id = auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.is_group_owner(gid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from study_groups g where g.id = gid and g.owner_id = auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.create_group(p_name text)
 RETURNS study_groups
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g public.study_groups; code text; tries int := 0;
begin
  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into study_groups (name, join_code, owner_id) values (p_name, code, auth.uid()) returning * into g;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 6 then raise; end if;
    end;
  end loop;
  insert into group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return g;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare gid uuid;
begin
  select id into gid from study_groups where join_code = upper(p_code);
  if gid is null then raise exception 'Group not found'; end if;
  insert into group_members (group_id, user_id) values (gid, auth.uid()) on conflict (group_id, user_id) do nothing;
  return gid;
end;
$function$;

CREATE OR REPLACE FUNCTION public.my_groups()
 RETURNS TABLE(id uuid, name text, join_code text, owner_id uuid, member_count bigint, internship_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select g.id, g.name, g.join_code, g.owner_id,
    (select count(*) from group_members m where m.group_id = g.id) as member_count,
    (select count(*) from group_internships gi where gi.group_id = g.id) as internship_count
  from study_groups g
  where exists (select 1 from group_members m2 where m2.group_id = g.id and m2.user_id = auth.uid())
  order by g.created_at desc;
$function$;

CREATE OR REPLACE FUNCTION public.group_members_view(p_group uuid)
 RETURNS TABLE(user_id uuid, full_name text, avatar_url text, joined_at timestamp with time zone, is_owner boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select m.user_id, p.full_name, p.avatar_url, m.joined_at, (g.owner_id = m.user_id) as is_owner
  from group_members m
  join study_groups g on g.id = m.group_id
  left join profiles p on p.id = m.user_id
  where m.group_id = p_group and public.is_group_member(p_group)
  order by is_owner desc, m.joined_at asc;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.add_xp(p_user uuid, p_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare new_xp int;
begin
  update profiles set xp = xp + p_amount
    where id = p_user returning xp into new_xp;
  -- tiap 200 XP naik 1 level
  update profiles set level = greatest(1, (new_xp / 200) + 1)
    where id = p_user;
end;
$function$;

-- Bind handle_new_user so every new auth user gets a profile row.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS POLICIES
CREATE POLICY "anyone can submit feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "own internships" ON public.internships FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_internships" ON public.internships FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "read achievements" ON public.achievements FOR SELECT TO public USING (true);

CREATE POLICY "own checklist" ON public.checklist_items FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_checklist" ON public.checklist_items FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "own ai" ON public.ai_generations FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_ai" ON public.ai_generations FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "own profile" ON public.profiles FOR ALL TO public USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "own achievements" ON public.user_achievements FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "own quests" ON public.quests FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "testimonials are public" ON public.testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users delete own testimonial" ON public.testimonials FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "users insert own testimonial" ON public.testimonials FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "users update own testimonial" ON public.testimonials FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "sg_delete" ON public.study_groups FOR DELETE TO public USING ((owner_id = auth.uid()));
CREATE POLICY "sg_insert" ON public.study_groups FOR INSERT TO public WITH CHECK ((owner_id = auth.uid()));
CREATE POLICY "sg_select" ON public.study_groups FOR SELECT TO public USING (is_group_member(id));
CREATE POLICY "sg_update" ON public.study_groups FOR UPDATE TO public USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));

CREATE POLICY "gm_delete" ON public.group_members FOR DELETE TO public USING (((user_id = auth.uid()) OR is_group_owner(group_id)));
CREATE POLICY "gm_insert" ON public.group_members FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "gm_select" ON public.group_members FOR SELECT TO public USING (is_group_member(group_id));

CREATE POLICY "gi_delete" ON public.group_internships FOR DELETE TO public USING (((added_by = auth.uid()) OR is_group_owner(group_id)));
CREATE POLICY "gi_insert" ON public.group_internships FOR INSERT TO public WITH CHECK ((is_group_member(group_id) AND (added_by = auth.uid())));
CREATE POLICY "gi_select" ON public.group_internships FOR SELECT TO public USING (is_group_member(group_id));

-- 5. STORAGE BUCKETS & POLICIES (posters, cvs, avatars)
-- Uploads are namespaced by user id: <user_id>/<file>. Buckets are public so
-- getPublicUrl() works for posters/cv/avatar images the app links to.
INSERT INTO storage.buckets (id, name, public)
VALUES ('posters', 'posters', true),
       ('cvs', 'cvs', true),
       ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "own uploads insert" ON storage.objects;
CREATE POLICY "own uploads insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('posters', 'cvs', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own uploads update" ON storage.objects;
CREATE POLICY "own uploads update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('posters', 'cvs', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id IN ('posters', 'cvs', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own uploads delete" ON storage.objects;
CREATE POLICY "own uploads delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('posters', 'cvs', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text);