-- Add Startup Leaderboard System
-- This migration creates a complete duplicate leaderboard for startup companies

-- ============================================================================
-- STARTUP TABLES
-- ============================================================================

-- Startup companies table
create table if not exists public.startup_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  logo_url text,
  tags text[] not null default '{}',
  headquarters text,
  founded_year smallint,
  created_at timestamptz not null default now()
);

-- Startup Elo ratings table
create table if not exists public.startup_elo (
  company_id uuid primary key references public.startup_companies(id) on delete cascade,
  rating numeric not null default 1500,
  matches_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Startup matchups (vote history) table
create table if not exists public.startup_matchups (
  id bigserial primary key,
  company_a uuid not null references public.startup_companies(id) on delete cascade,
  company_b uuid not null references public.startup_companies(id) on delete cascade,
  result text not null check (result in ('a','b','draw')),
  rating_a_before numeric not null,
  rating_b_before numeric not null,
  rating_a_after numeric not null,
  rating_b_after numeric not null,
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  ip_address inet
);

-- Indexes for startup matchups (performance)
create index if not exists startup_matchups_ip_created_at_idx
  on public.startup_matchups (ip_address, created_at desc);

create index if not exists startup_matchups_submitted_by_created_at_idx
  on public.startup_matchups (submitted_by, created_at desc);

-- Startup draw violation logs (anti-spam)
create table if not exists public.startup_draw_violation_logs (
  id bigserial primary key,
  ip_address inet,
  submitter uuid references auth.users(id) on delete set null,
  company_a uuid references public.startup_companies(id) on delete set null,
  company_b uuid references public.startup_companies(id) on delete set null,
  violation_count integer not null default 3,
  created_at timestamptz not null default now()
);

-- Startup Elo history (time-series data for charts)
create table if not exists public.startup_elo_history (
  id bigserial primary key,
  company_id uuid not null references public.startup_companies(id) on delete cascade,
  matchup_id bigint references public.startup_matchups(id) on delete cascade,
  rating numeric not null,
  rank integer,
  created_at timestamptz not null default now()
);

-- Startup reviews table
create table if not exists public.startup_reviews (
  id bigserial primary key,
  company_id uuid not null references public.startup_companies(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text,
  body text not null,
  rating smallint check (rating between 1 and 5),
  status text not null default 'published' check (status in ('draft','published','archived')),
  program text,
  cohort text,
  pay numeric,
  culture numeric,
  prestige numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add moddatetime trigger for startup reviews
drop trigger if exists handle_startup_reviews_updated_at on public.startup_reviews;
create trigger handle_startup_reviews_updated_at
before update on public.startup_reviews
for each row execute procedure moddatetime(updated_at);

-- Add profanity check constraints for startup reviews
alter table public.startup_reviews
  add constraint startup_reviews_body_profanity_check
  check (not public.contains_prohibited_language(body));

alter table public.startup_reviews
  add constraint startup_reviews_title_profanity_check
  check (coalesce(title, '') = '' or not public.contains_prohibited_language(title));

-- Startup review reactions table
create table if not exists public.startup_review_reactions (
  review_id bigint not null references public.startup_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ============================================================================
-- STARTUP VIEWS
-- ============================================================================

-- Startup leaderboard view (comprehensive company data)
create or replace view public.startup_leaderboard
with (security_invoker = true) as
select
  c.id,
  c.name,
  c.slug,
  c.description,
  c.logo_url,
  c.tags,
  ce.rating,
  ce.matches_played,
  ce.wins,
  ce.losses,
  ce.draws,
  dense_rank() over (order by ce.rating desc, c.created_at asc) as rank,
  coalesce(stats.review_count, 0) as review_count,
  stats.average_rating,
  stats.average_pay,
  stats.average_culture,
  stats.average_prestige,
  latest.title as latest_review_title,
  latest.body as latest_review_body,
  latest.rating as latest_review_rating,
  latest.author_name as latest_review_author,
  latest.created_at as latest_review_created_at
from public.startup_companies c
join public.startup_elo ce on ce.company_id = c.id
left join lateral (
  select
    count(*) filter (where status = 'published') as review_count,
    avg(r.rating) filter (where status = 'published') as average_rating,
    avg(r.pay) filter (where status = 'published') as average_pay,
    avg(r.culture) filter (where status = 'published') as average_culture,
    avg(r.prestige) filter (where status = 'published') as average_prestige
  from public.startup_reviews r
  where r.company_id = c.id
) stats on true
left join lateral (
  select
    rv.title,
    rv.body,
    rv.rating,
    coalesce(p.display_name, 'Anonymous') as author_name,
    rv.created_at
  from public.startup_reviews rv
  left join public.profiles p on p.id = rv.author_id
  where rv.company_id = c.id
    and rv.status = 'published'
  order by rv.created_at desc
  limit 1
) latest on true;

-- Startup reviews with metadata view
create or replace view public.startup_reviews_with_meta
with (security_invoker = true) as
select
  r.id,
  r.company_id,
  r.author_id,
  coalesce(p.display_name, 'Anonymous') as author_name,
  r.title,
  r.body,
  r.rating,
  r.program,
  r.cohort,
  r.pay,
  r.culture,
  r.prestige,
  r.status,
  r.created_at,
  r.updated_at,
  coalesce(reactions.likes, 0) as likes,
  coalesce(reactions.liked_by, '{}'::uuid[]) as liked_by
from public.startup_reviews r
left join public.profiles p on p.id = r.author_id
left join lateral (
  select
    count(*) as likes,
    array_agg(rr.user_id) as liked_by
  from public.startup_review_reactions rr
  where rr.review_id = r.id
) reactions on true
where r.status = 'published';

-- ============================================================================
-- STARTUP MATCHUP RECORDING FUNCTION
-- ============================================================================

create or replace function public.record_startup_matchup(
  company_a uuid,
  company_b uuid,
  result text,
  submitted_by uuid default null,
  k_factor numeric default 32,
  voter_ip inet default null
) returns table (
  company_id uuid,
  rating numeric,
  matches_played integer,
  wins integer,
  losses integer,
  draws integer,
  rank integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  company_a_id uuid := company_a;
  company_b_id uuid := company_b;
  a_rating numeric;
  b_rating numeric;
  a_k numeric;
  b_k numeric;
  exp_a numeric;
  exp_b numeric;
  score_a numeric;
  score_b numeric;
  new_a numeric;
  new_b numeric;
  matchup_id bigint;
  submitter uuid;
  ip_input inet := voter_ip;
  draw_streak integer := 0;
  forwarded_header text;
  ip_recent_votes integer := 0;
  ip_company_recent integer := 0;
  submitter_recent integer := 0;
begin
  if company_a_id = company_b_id then
    raise exception 'company_a and company_b must be different companies';
  end if;

  if result not in ('a', 'b', 'draw') then
    raise exception 'result must be a, b, or draw';
  end if;

  submitter := coalesce(submitted_by, auth.uid());

  if ip_input is null then
    begin
      forwarded_header := nullif(current_setting('request.header.x-forwarded-for', true), '');
      if forwarded_header is not null then
        ip_input := split_part(forwarded_header, ',', 1)::inet;
      end if;
    exception
      when others then
        ip_input := null;
    end;
  end if;

  -- Rate limiting: IP burst protection (12 votes per 10 minutes)
  if ip_input is not null then
    select count(*) into ip_recent_votes
    from public.startup_matchups m
    where m.ip_address = ip_input
      and m.created_at > now() - interval '10 minutes';

    if ip_recent_votes >= 12 then
      raise exception 'Too many votes from this IP in a short period. Please wait before voting again.';
    end if;

    -- Rate limiting: IP per company (6 votes per 24 hours)
    select count(*) into ip_company_recent
    from public.startup_matchups m
    where m.ip_address = ip_input
      and m.created_at > now() - interval '24 hours'
      and (
        m.company_a = company_a_id
        or m.company_b = company_a_id
        or m.company_a = company_b_id
        or m.company_b = company_b_id
      );

    if ip_company_recent >= 6 then
      raise exception 'Daily vote limit reached for one of these companies from this IP. Please try again tomorrow.';
    end if;
  end if;

  -- Rate limiting: Authenticated user (15 votes per 6 hours)
  if submitter is not null then
    select count(*) into submitter_recent
    from public.startup_matchups m
    where m.submitted_by = submitter
      and m.created_at > now() - interval '6 hours';

    if submitter_recent >= 15 then
      raise exception 'Account vote limit reached. Please wait before voting again.';
    end if;
  end if;

  -- Rate limiting: Matchup coordination (40 votes per 90 seconds)
  if (
    select count(*)
    from public.startup_matchups m
    where m.created_at > now() - interval '90 seconds'
      and (
        m.company_a in (company_a_id, company_b_id)
        or m.company_b in (company_a_id, company_b_id)
      )
  ) >= 40 then
    raise exception 'Too many recent votes for this matchup. Please try again later.';
  end if;

  -- Auto-seed Elo records if they don't exist
  insert into public.startup_elo (company_id)
    values (company_a_id)
    on conflict on constraint startup_elo_pkey do nothing;

  insert into public.startup_elo (company_id)
    values (company_b_id)
    on conflict on constraint startup_elo_pkey do nothing;

  -- Draw spam protection (max 2 consecutive draws)
  if result = 'draw' then
    if ip_input is not null then
      select count(*) into draw_streak
      from (
        select result
        from public.startup_matchups
        where ip_address = ip_input
        order by created_at desc
        limit 2
      ) recent
      where recent.result = 'draw';
    elsif submitter is not null then
      select count(*) into draw_streak
      from (
        select result
        from public.startup_matchups
        where submitted_by = submitter
        order by created_at desc
        limit 2
      ) recent
      where recent.result = 'draw';
    end if;

    if draw_streak = 2 then
      insert into public.startup_draw_violation_logs (ip_address, submitter, company_a, company_b, violation_count)
      values (ip_input, submitter, company_a_id, company_b_id, draw_streak + 1);
      raise exception 'Draw limit reached for this IP. Please choose a winner.';
    end if;
  end if;

  -- Lock rows for update (prevent race conditions)
  select ce.rating
  into a_rating
  from public.startup_elo ce
  where ce.company_id = company_a_id
  for update of ce;

  select ce.rating
  into b_rating
  from public.startup_elo ce
  where ce.company_id = company_b_id
  for update of ce;

  -- Calculate K-factor for EACH player based on THEIR OWN rating
  -- This is how chess Elo works - each player has their own K

  -- Company A's K-factor
  a_k := coalesce(k_factor, 32);
  if a_rating >= 2400 then
    a_k := least(a_k, 16);
  end if;
  if a_rating >= 2600 then
    a_k := least(a_k, 12);
  end if;
  if a_rating >= 2800 then
    a_k := least(a_k, 10);
  end if;
  a_k := greatest(a_k, 10);

  -- Company B's K-factor
  b_k := coalesce(k_factor, 32);
  if b_rating >= 2400 then
    b_k := least(b_k, 16);
  end if;
  if b_rating >= 2600 then
    b_k := least(b_k, 12);
  end if;
  if b_rating >= 2800 then
    b_k := least(b_k, 10);
  end if;
  b_k := greatest(b_k, 10);

  -- Calculate expected scores
  exp_a := 1 / (1 + power(10, (b_rating - a_rating) / 400));
  exp_b := 1 / (1 + power(10, (a_rating - b_rating) / 400));

  -- Determine actual scores
  if result = 'draw' then
    score_a := 0.5;
    score_b := 0.5;
  elsif result = 'a' then
    score_a := 1;
    score_b := 0;
  else
    score_a := 0;
    score_b := 1;
  end if;

  -- Calculate new ratings (each player uses THEIR OWN K-factor)
  new_a := a_rating + a_k * (score_a - exp_a);
  new_b := b_rating + b_k * (score_b - exp_b);

  -- Apply global min/max caps (800 - 3100)
  new_a := least(3100, greatest(800, new_a));
  new_b := least(3100, greatest(800, new_b));

  -- Update Company A Elo
  update public.startup_elo as ce
    set rating = new_a,
        matches_played = ce.matches_played + 1,
        wins = ce.wins + case when result = 'a' then 1 else 0 end,
        losses = ce.losses + case when result = 'b' then 1 else 0 end,
        draws = ce.draws + case when result = 'draw' then 1 else 0 end,
        updated_at = now()
    where ce.company_id = company_a_id;

  -- Update Company B Elo
  update public.startup_elo as ce
    set rating = new_b,
        matches_played = ce.matches_played + 1,
        wins = ce.wins + case when result = 'b' then 1 else 0 end,
        losses = ce.losses + case when result = 'a' then 1 else 0 end,
        draws = ce.draws + case when result = 'draw' then 1 else 0 end,
        updated_at = now()
    where ce.company_id = company_b_id;

  -- Insert matchup record
  insert into public.startup_matchups (
    company_a,
    company_b,
    result,
    rating_a_before,
    rating_b_before,
    rating_a_after,
    rating_b_after,
    submitted_by,
    ip_address
  )
  values (
    company_a_id,
    company_b_id,
    result,
    a_rating,
    b_rating,
    new_a,
    new_b,
    submitter,
    ip_input
  )
  returning id into matchup_id;

  -- Record Elo history for both companies
  with ranking as (
    select
      c.id,
      dense_rank() over (order by ce.rating desc, c.created_at asc)::integer as rank
    from public.startup_companies c
    join public.startup_elo ce on ce.company_id = c.id
  ),
  updated as (
    select company_a_id as company_id, new_a as rating
    union all
    select company_b_id as company_id, new_b as rating
  )
  insert into public.startup_elo_history (company_id, matchup_id, rating, rank)
  select u.company_id, matchup_id, u.rating, r.rank
  from updated u
  join ranking r on r.id = u.company_id;

  -- Return updated company stats with ranks
  return query
  select
    ce.company_id,
    ce.rating,
    ce.matches_played,
    ce.wins,
    ce.losses,
    ce.draws,
    ranks.rank
  from public.startup_elo ce
  join (
    select
      c.id,
      dense_rank() over (order by ce.rating desc, c.created_at asc)::integer as rank
    from public.startup_companies c
    join public.startup_elo ce on ce.company_id = c.id
  ) ranks on ranks.id = ce.company_id
  where ce.company_id in (company_a_id, company_b_id);
end;
$$;

-- Restrict execution to service role only (called via Edge Function)
revoke execute on function public.record_startup_matchup(uuid, uuid, text, uuid, numeric, inet) from public, anon, authenticated;
grant execute on function public.record_startup_matchup(uuid, uuid, text, uuid, numeric, inet) to service_role;

-- ============================================================================
-- AUTO-SEED TRIGGER FOR STARTUP ELO
-- ============================================================================

create or replace function public.handle_startup_company_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.startup_elo (company_id)
  values (new.id)
  on conflict on constraint startup_elo_pkey do nothing;
  return new;
end;
$$;

drop trigger if exists on_startup_company_created_seed_elo on public.startup_companies;
create trigger on_startup_company_created_seed_elo
after insert on public.startup_companies
for each row execute procedure public.handle_startup_company_insert();

-- ============================================================================
-- GRANTS
-- ============================================================================

grant select on public.startup_companies, public.startup_elo, public.startup_matchups, public.startup_elo_history to anon, authenticated;
grant select on public.startup_companies, public.startup_elo, public.startup_matchups, public.startup_elo_history to service_role;

grant select on public.startup_leaderboard, public.startup_reviews_with_meta to anon, authenticated;
grant select on public.startup_leaderboard, public.startup_reviews_with_meta to service_role;

grant insert, update, delete on public.startup_reviews to authenticated;
grant insert, update, delete on public.startup_reviews to service_role;

grant select on public.startup_review_reactions to anon, authenticated;
grant select on public.startup_review_reactions to service_role;

grant insert, delete on public.startup_review_reactions to authenticated;
grant insert, delete on public.startup_review_reactions to service_role;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Startup companies RLS
alter table public.startup_companies enable row level security;
create policy "Public read startup companies" on public.startup_companies
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );

-- Startup Elo RLS
alter table public.startup_elo enable row level security;
create policy "Public read startup elo" on public.startup_elo
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
create policy "Vote updates startup elo" on public.startup_elo
  for update
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  )
  with check (true);
create policy "Vote inserts startup elo" on public.startup_elo
  for insert
  with check (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );

-- Startup matchups RLS
alter table public.startup_matchups enable row level security;
create policy "Public read startup matchups" on public.startup_matchups
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
create policy "Votes insert startup matchups" on public.startup_matchups
  for insert
  with check (
    current_user = 'postgres'
    or (
      coalesce((select auth.role()), 'anon') in ('anon', 'authenticated')
     and (submitted_by = (select auth.uid()) or submitted_by is null))
    or (select auth.role()) = 'service_role'
  );

-- Startup Elo history RLS
alter table public.startup_elo_history enable row level security;
create policy "Public read startup elo history" on public.startup_elo_history
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
create policy "Votes insert startup elo history" on public.startup_elo_history
  for insert
  with check (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );

-- Startup reviews RLS
alter table public.startup_reviews enable row level security;
create policy "Public read published startup reviews" on public.startup_reviews
  for select
  using (
    status = 'published'
    and (
      current_user = 'postgres'
      or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
    )
  );
create policy "Users manage own startup reviews" on public.startup_reviews
  for insert
  with check ((select auth.uid()) = author_id);
create policy "Moderate startup reviews" on public.startup_reviews
  for update
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
    )
    or (select auth.role()) = 'service_role'
    or current_user = 'postgres'
  )
  with check (
    (select auth.uid()) = author_id
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
    )
    or (select auth.role()) = 'service_role'
    or current_user = 'postgres'
  );
create policy "Admins delete startup reviews" on public.startup_reviews
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
    )
  );

-- Startup review reactions RLS
alter table public.startup_review_reactions enable row level security;
create policy "Public read startup reactions" on public.startup_review_reactions
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
create policy "Users insert startup reactions" on public.startup_review_reactions
  for insert
  with check ((select auth.uid()) = user_id);
create policy "Users delete startup reactions" on public.startup_review_reactions
  for delete
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- SEED STARTUP COMPANIES DATA
-- ============================================================================

-- Insert all 93 startup companies with initial Elo of 1500
insert into public.startup_companies (name, slug, tags, founded_year) values
  ('OpenAI', 'openai', ARRAY['AI', 'ML', 'Research'], 2015),
  ('Anthropic', 'anthropic', ARRAY['AI', 'ML', 'Research'], 2021),
  ('Perplexity', 'perplexity', ARRAY['AI', 'Search'], 2022),
  ('Stripe', 'stripe', ARRAY['Fintech', 'Payments'], 2010),
  ('Databricks', 'databricks', ARRAY['Data', 'Analytics'], 2013),
  ('Ramp', 'ramp', ARRAY['Fintech', 'Expense Management'], 2019),
  ('Brex', 'brex', ARRAY['Fintech', 'Corporate Cards'], 2017),
  ('Mercury', 'mercury', ARRAY['Fintech', 'Banking'], 2017),
  ('Vercel', 'vercel', ARRAY['Cloud', 'Developer Tools'], 2015),
  ('Supabase', 'supabase', ARRAY['Cloud', 'Database'], 2020),
  ('Replit', 'replit', ARRAY['Developer Tools', 'Cloud'], 2016),
  ('Linear', 'linear', ARRAY['Productivity', 'Project Management'], 2019),
  ('Figma', 'figma', ARRAY['Design', 'Collaboration'], 2012),
  ('Notion', 'notion', ARRAY['Productivity', 'Knowledge Management'], 2016),
  ('Rippling', 'rippling', ARRAY['HR', 'Payroll'], 2016),
  ('Deel', 'deel', ARRAY['HR', 'International'], 2019),
  ('Scale AI', 'scale-ai', ARRAY['AI', 'Data Labeling'], 2016),
  ('Mistral AI', 'mistral-ai', ARRAY['AI', 'ML'], 2023),
  ('Cohere', 'cohere', ARRAY['AI', 'NLP'], 2019),
  ('Runway', 'runway', ARRAY['AI', 'Video'], 2018),
  ('Harvey', 'harvey', ARRAY['AI', 'Legal'], 2022),
  ('Cursor', 'cursor', ARRAY['AI', 'Developer Tools'], 2023),
  ('LangChain', 'langchain', ARRAY['AI', 'Developer Tools'], 2022),
  ('ElevenLabs', 'elevenlabs', ARRAY['AI', 'Audio'], 2022),
  ('Adept', 'adept', ARRAY['AI', 'ML'], 2022),
  ('Stability AI', 'stability-ai', ARRAY['AI', 'Image Generation'], 2020),
  ('Fixie', 'fixie', ARRAY['AI', 'Developer Tools'], 2022),
  ('Character.ai', 'character-ai', ARRAY['AI', 'Chatbots'], 2021),
  ('Glean', 'glean', ARRAY['AI', 'Enterprise Search'], 2019),
  ('Abacus AI', 'abacus-ai', ARRAY['AI', 'ML'], 2019),
  ('Inflection AI', 'inflection-ai', ARRAY['AI', 'ML'], 2022),
  ('Datacurve', 'datacurve', ARRAY['Data', 'Analytics'], 2020),
  ('Weaviate', 'weaviate', ARRAY['AI', 'Vector Database'], 2019),
  ('Pinecone', 'pinecone', ARRAY['AI', 'Vector Database'], 2019),
  ('PlanetScale', 'planetscale', ARRAY['Database', 'Cloud'], 2018),
  ('Prisma', 'prisma', ARRAY['Database', 'Developer Tools'], 2016),
  ('Fly.io', 'fly-io', ARRAY['Cloud', 'Infrastructure'], 2017),
  ('Railway', 'railway', ARRAY['Cloud', 'Infrastructure'], 2020),
  ('Cloudflare', 'cloudflare', ARRAY['Cloud', 'CDN', 'Security'], 2009),
  ('Tailscale', 'tailscale', ARRAY['Networking', 'Security'], 2019),
  ('HashiCorp', 'hashicorp', ARRAY['DevOps', 'Infrastructure'], 2012),
  ('Temporal', 'temporal', ARRAY['Developer Tools', 'Workflow'], 2019),
  ('Sentry', 'sentry', ARRAY['Developer Tools', 'Monitoring'], 2012),
  ('Render', 'render', ARRAY['Cloud', 'Infrastructure'], 2018),
  ('Clerk', 'clerk', ARRAY['Developer Tools', 'Authentication'], 2020),
  ('PostHog', 'posthog', ARRAY['Analytics', 'Product'], 2020),
  ('Retool', 'retool', ARRAY['Developer Tools', 'Internal Tools'], 2017),
  ('Pulumi', 'pulumi', ARRAY['DevOps', 'Infrastructure'], 2017),
  ('Algolia', 'algolia', ARRAY['Search', 'Developer Tools'], 2012),
  ('Buildkite', 'buildkite', ARRAY['DevOps', 'CI/CD'], 2013),
  ('Modern Treasury', 'modern-treasury', ARRAY['Fintech', 'Payments'], 2018),
  ('Plaid', 'plaid', ARRAY['Fintech', 'Banking'], 2013),
  ('Pipe', 'pipe', ARRAY['Fintech', 'SaaS'], 2019),
  ('Wise', 'wise', ARRAY['Fintech', 'International'], 2011),
  ('Chime', 'chime', ARRAY['Fintech', 'Banking'], 2013),
  ('Monzo', 'monzo', ARRAY['Fintech', 'Banking'], 2015),
  ('Gusto', 'gusto', ARRAY['HR', 'Payroll'], 2011),
  ('Synctera', 'synctera', ARRAY['Fintech', 'Banking'], 2020),
  ('Navan', 'navan', ARRAY['Travel', 'Expense Management'], 2015),
  ('Affirm', 'affirm', ARRAY['Fintech', 'BNPL'], 2012),
  ('Mintlify', 'mintlify', ARRAY['Developer Tools', 'Documentation'], 2021),
  ('Convex', 'convex', ARRAY['Database', 'Developer Tools'], 2021),
  ('A0.dev', 'a0-dev', ARRAY['Developer Tools', 'AI'], 2023),
  ('Zed', 'zed', ARRAY['Developer Tools', 'IDE'], 2021),
  ('Raycast', 'raycast', ARRAY['Productivity', 'Mac'], 2020),
  ('Height', 'height', ARRAY['Productivity', 'Project Management'], 2019),
  ('Cron', 'cron', ARRAY['Productivity', 'Calendar'], 2019),
  ('Tana', 'tana', ARRAY['Productivity', 'Knowledge Management'], 2021),
  ('SupaModal', 'supamodal', ARRAY['Developer Tools', 'UI'], 2023),
  ('Inngest', 'inngest', ARRAY['Developer Tools', 'Workflow'], 2021),
  ('BaseHub', 'basehub', ARRAY['Developer Tools', 'CMS'], 2023),
  ('Flightcontrol', 'flightcontrol', ARRAY['Cloud', 'Infrastructure'], 2021),
  ('Cal.com', 'cal-com', ARRAY['Productivity', 'Scheduling'], 2021),
  ('Meticulous', 'meticulous', ARRAY['Developer Tools', 'Testing'], 2021),
  ('Superhuman', 'superhuman', ARRAY['Productivity', 'Email'], 2015),
  ('Coda', 'coda', ARRAY['Productivity', 'Documents'], 2014),
  ('Loom', 'loom', ARRAY['Productivity', 'Video'], 2016),
  ('Pitch', 'pitch', ARRAY['Productivity', 'Presentations'], 2018),
  ('Miro', 'miro', ARRAY['Productivity', 'Collaboration'], 2011),
  ('Zapier', 'zapier', ARRAY['Automation', 'Integration'], 2011),
  ('Webflow', 'webflow', ARRAY['Web', 'No-Code'], 2013),
  ('Airbyte', 'airbyte', ARRAY['Data', 'ETL'], 2020),
  ('Vitally', 'vitally', ARRAY['Customer Success', 'Analytics'], 2017),
  ('Stytch', 'stytch', ARRAY['Developer Tools', 'Authentication'], 2020),
  ('OpenPipe', 'openpipe', ARRAY['AI', 'Developer Tools'], 2023),
  ('OneSchema', 'oneschema', ARRAY['Data', 'Developer Tools'], 2021),
  ('Wealthsimple', 'wealthsimple', ARRAY['Fintech', 'Investing'], 2014),
  ('Float', 'float', ARRAY['Fintech', 'Accounting'], 2011),
  ('Neo Financial', 'neo-financial', ARRAY['Fintech', 'Banking'], 2019),
  ('Koho', 'koho', ARRAY['Fintech', 'Banking'], 2014),
  ('Ada', 'ada', ARRAY['AI', 'Customer Service'], 2016),
  ('Clio', 'clio', ARRAY['Legal', 'SaaS'], 2008),
  ('BenchSci', 'benchsci', ARRAY['AI', 'Biotech'], 2012),
  ('Properly', 'properly', ARRAY['Real Estate', 'Proptech'], 2018),
  ('Anduril', 'anduril', ARRAY['Defense', 'Hardware'], 2017),
  ('SpaceX', 'spacex', ARRAY['Aerospace', 'Hardware'], 2002)
on conflict (name) do nothing;

-- Ensure all startup companies have Elo records (trigger will auto-create, but just in case)
insert into public.startup_elo (company_id)
select id from public.startup_companies
on conflict (company_id) do nothing;
