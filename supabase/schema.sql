-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- Base tables -----------------------------------------------------------------

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  website text,
  logo_url text,
  created_at timestamptz not null default now()
);

alter table public.companies
  add column if not exists tags text[] not null default '{}',
  add column if not exists headquarters text,
  add column if not exists founded_year smallint;

create table if not exists public.company_elo (
  company_id uuid primary key references public.companies(id) on delete cascade,
  rating numeric not null default 1500,
  matches_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.company_elo (company_id)
select id
from public.companies
on conflict (company_id) do nothing;

create table if not exists public.matchups (
  id bigserial primary key,
  company_a uuid not null references public.companies(id) on delete cascade,
  company_b uuid not null references public.companies(id) on delete cascade,
  result text not null check (result in ('a','b','draw')),
  rating_a_before numeric not null,
  rating_b_before numeric not null,
  rating_a_after numeric not null,
  rating_b_after numeric not null,
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.elo_history (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  matchup_id bigint references public.matchups(id) on delete cascade,
  rating numeric not null,
  rank integer,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','moderator','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
before update on public.profiles
for each row execute procedure moddatetime(updated_at);

create table if not exists public.reviews (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
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

drop trigger if exists handle_reviews_updated_at on public.reviews;
create trigger handle_reviews_updated_at
before update on public.reviews
for each row execute procedure moddatetime(updated_at);

create table if not exists public.review_reactions (
  review_id bigint not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- Views -----------------------------------------------------------------------

create or replace view public.company_leaderboard as
select
  c.id,
  c.name,
  c.slug,
  c.description,
  c.website,
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
from public.companies c
join public.company_elo ce on ce.company_id = c.id
left join lateral (
  select
    count(*) filter (where status = 'published') as review_count,
    avg(r.rating) filter (where status = 'published') as average_rating,
    avg(r.pay) filter (where status = 'published') as average_pay,
    avg(r.culture) filter (where status = 'published') as average_culture,
    avg(r.prestige) filter (where status = 'published') as average_prestige
  from public.reviews r
  where r.company_id = c.id
) stats on true
left join lateral (
  select
    rv.title,
    rv.body,
    rv.rating,
    coalesce(p.display_name, 'Anonymous') as author_name,
    rv.created_at
  from public.reviews rv
  left join public.profiles p on p.id = rv.author_id
  where rv.company_id = c.id
    and rv.status = 'published'
  order by rv.created_at desc
  limit 1
) latest on true;

create or replace view public.company_reviews_with_meta as
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
from public.reviews r
left join public.profiles p on p.id = r.author_id
left join lateral (
  select
    count(*) as likes,
    array_agg(rr.user_id) as liked_by
  from public.review_reactions rr
  where rr.review_id = r.id
) reactions on true
where r.status = 'published';

-- Record matchup function -----------------------------------------------------

create or replace function public.record_matchup(
  company_a uuid,
  company_b uuid,
  result text,
  submitted_by uuid default null,
  k_factor numeric default 32
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
  a_rating numeric;
  b_rating numeric;
  exp_a numeric;
  exp_b numeric;
  score_a numeric;
  score_b numeric;
  new_a numeric;
  new_b numeric;
  matchup_id bigint;
  submitter uuid;
begin
  if company_a = company_b then
    raise exception 'company_a and company_b must be different companies';
  end if;

  if result not in ('a', 'b', 'draw') then
    raise exception 'result must be a, b, or draw';
  end if;

  submitter := coalesce(submitted_by, auth.uid());

  insert into public.company_elo (company_id)
    values (company_a)
    on conflict (company_id) do nothing;

  insert into public.company_elo (company_id)
    values (company_b)
    on conflict (company_id) do nothing;

  select rating into a_rating
  from public.company_elo
  where company_id = company_a
  for update;

  select rating into b_rating
  from public.company_elo
  where company_id = company_b
  for update;

  exp_a := 1 / (1 + power(10, (b_rating - a_rating) / 400));
  exp_b := 1 / (1 + power(10, (a_rating - b_rating) / 400));

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

  new_a := a_rating + k_factor * (score_a - exp_a);
  new_b := b_rating + k_factor * (score_b - exp_b);

  update public.company_elo
    set rating = new_a,
        matches_played = matches_played + 1,
        wins = wins + case when result = 'a' then 1 else 0 end,
        losses = losses + case when result = 'b' then 1 else 0 end,
        draws = draws + case when result = 'draw' then 1 else 0 end,
        updated_at = now()
    where company_id = company_a;

  update public.company_elo
    set rating = new_b,
        matches_played = matches_played + 1,
        wins = wins + case when result = 'b' then 1 else 0 end,
        losses = losses + case when result = 'a' then 1 else 0 end,
        draws = draws + case when result = 'draw' then 1 else 0 end,
        updated_at = now()
    where company_id = company_b;

  insert into public.matchups (
    company_a,
    company_b,
    result,
    rating_a_before,
    rating_b_before,
    rating_a_after,
    rating_b_after,
    submitted_by
  )
  values (
    company_a,
    company_b,
    result,
    a_rating,
    b_rating,
    new_a,
    new_b,
    submitter
  )
  returning id into matchup_id;

  with ranking as (
    select
      c.id,
      dense_rank() over (order by ce.rating desc, c.created_at asc) as rank
    from public.companies c
    join public.company_elo ce on ce.company_id = c.id
  ),
  updated as (
    select company_a as company_id, new_a as rating
    union all
    select company_b as company_id, new_b as rating
  )
  insert into public.elo_history (company_id, matchup_id, rating, rank)
  select u.company_id, matchup_id, u.rating, r.rank
  from updated u
  join ranking r on r.id = u.company_id;

  return query
  select
    ce.company_id,
    ce.rating,
    ce.matches_played,
    ce.wins,
    ce.losses,
    ce.draws,
    r.rank
  from public.company_elo ce
  join (
    select
      c.id,
      dense_rank() over (order by ce.rating desc, c.created_at asc) as rank
    from public.companies c
    join public.company_elo ce on ce.company_id = c.id
  ) r on r.id = ce.company_id
  where ce.company_id in (company_a, company_b);
end;
$$;

grant execute on function public.record_matchup(uuid, uuid, text, uuid, numeric) to anon, authenticated;

-- Authentication profile sync -------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Grants ----------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.companies, public.company_elo, public.matchups, public.elo_history to anon, authenticated;
grant select on public.company_leaderboard, public.company_reviews_with_meta to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant select on public.review_reactions to anon, authenticated;
grant insert, delete on public.review_reactions to authenticated;

-- Row Level Security ----------------------------------------------------------

alter table public.companies enable row level security;
drop policy if exists "Public read companies" on public.companies;
create policy "Public read companies" on public.companies
  for select
  using (true);

alter table public.company_elo enable row level security;
drop policy if exists "Public read elo" on public.company_elo;
create policy "Public read elo" on public.company_elo
  for select
  using (true);
drop policy if exists "Vote updates elo" on public.company_elo;
create policy "Vote updates elo" on public.company_elo
  for update
  using (
    current_user = 'postgres'
    or coalesce(auth.role(), 'anon') in ('anon', 'authenticated', 'service_role')
  )
  with check (true);
drop policy if exists "Vote inserts elo" on public.company_elo;
create policy "Vote inserts elo" on public.company_elo
  for insert
  with check (
    current_user = 'postgres'
    or coalesce(auth.role(), 'anon') in ('anon', 'authenticated', 'service_role')
  );

alter table public.matchups enable row level security;
drop policy if exists "Public read matchups" on public.matchups;
create policy "Public read matchups" on public.matchups
  for select
  using (true);
drop policy if exists "Service role writes matchups" on public.matchups;
create policy "Service role writes matchups" on public.matchups
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
drop policy if exists "Admins write matchups" on public.matchups;
create policy "Admins write matchups" on public.matchups
  for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'moderator')
    )
  );
drop policy if exists "Votes insert matchups" on public.matchups;
create policy "Votes insert matchups" on public.matchups
  for insert
  with check (
    current_user = 'postgres'
    or (
      coalesce(auth.role(), 'anon') in ('anon', 'authenticated')
     and (submitted_by = auth.uid() or submitted_by is null))
    or auth.role() = 'service_role'
  );

alter table public.elo_history enable row level security;
drop policy if exists "Public read elo history" on public.elo_history;
create policy "Public read elo history" on public.elo_history
  for select
  using (true);
drop policy if exists "Votes insert elo history" on public.elo_history;
create policy "Votes insert elo history" on public.elo_history
  for insert
  with check (
    current_user = 'postgres'
    or coalesce(auth.role(), 'anon') in ('anon', 'authenticated', 'service_role')
  );

alter table public.profiles enable row level security;
drop policy if exists "Own profile read/write" on public.profiles;
create policy "Own profile read/write" on public.profiles
  using (id = auth.uid())
  with check (id = auth.uid());

alter table public.reviews enable row level security;
drop policy if exists "Public read published reviews" on public.reviews;
create policy "Public read published reviews" on public.reviews
  for select
  using (status = 'published');
drop policy if exists "Users manage own reviews" on public.reviews;
create policy "Users manage own reviews" on public.reviews
  for insert
  with check (auth.uid() = author_id);
drop policy if exists "Users update own reviews" on public.reviews;
create policy "Users update own reviews" on public.reviews
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews" on public.reviews
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'moderator')
    )
  );
drop policy if exists "Admins delete reviews" on public.reviews;
create policy "Admins delete reviews" on public.reviews
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'moderator')
    )
  );

alter table public.review_reactions enable row level security;
drop policy if exists "Public read reactions" on public.review_reactions;
create policy "Public read reactions" on public.review_reactions
  for select
  using (true);
drop policy if exists "Users manage reactions" on public.review_reactions;
create policy "Users manage reactions" on public.review_reactions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ensure default privileges for future tables/views ---------------------------

alter default privileges in schema public
grant select on tables to anon, authenticated;
alter default privileges in schema public
grant insert on tables to authenticated;

-- Automatic seeding of company elo -------------------------------------------

create or replace function public.handle_company_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.company_elo (company_id)
  values (new.id)
  on conflict (company_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_company_created_seed_elo on public.companies;
create trigger on_company_created_seed_elo
after insert on public.companies
for each row execute procedure public.handle_company_insert();
