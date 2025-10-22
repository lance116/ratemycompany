-- Optimize RLS policies to avoid repeated auth.* evaluation and remove redundant policies

alter table public.companies enable row level security;
drop policy if exists "Public read companies" on public.companies;
drop policy if exists "Authenticated read companies" on public.companies;
create policy "Public read companies" on public.companies
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );

alter table public.company_elo enable row level security;
drop policy if exists "Matchup function updates elo" on public.company_elo;
drop policy if exists "Service role updates elo" on public.company_elo;
drop policy if exists "Public read elo" on public.company_elo;
drop policy if exists "Authenticated read elo" on public.company_elo;
create policy "Public read elo" on public.company_elo
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
drop policy if exists "Vote updates elo" on public.company_elo;
create policy "Vote updates elo" on public.company_elo
  for update
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  )
  with check (true);
drop policy if exists "Vote inserts elo" on public.company_elo;
create policy "Vote inserts elo" on public.company_elo
  for insert
  with check (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );

alter table public.matchups enable row level security;
drop policy if exists "Public read matchups" on public.matchups;
drop policy if exists "Authenticated read matchups" on public.matchups;
create policy "Public read matchups" on public.matchups
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
drop policy if exists "Service role writes matchups" on public.matchups;
create policy "Service role writes matchups" on public.matchups
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');
drop policy if exists "Admins write matchups" on public.matchups;
create policy "Admins write matchups" on public.matchups
  for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
    )
  );
drop policy if exists "Votes insert matchups" on public.matchups;
create policy "Votes insert matchups" on public.matchups
  for insert
  with check (
    current_user = 'postgres'
    or (
      coalesce((select auth.role()), 'anon') in ('anon', 'authenticated')
      and (submitted_by = (select auth.uid()) or submitted_by is null)
    )
    or (select auth.role()) = 'service_role'
  );

alter table public.elo_history enable row level security;
drop policy if exists "Matchup function writes elo history" on public.elo_history;
drop policy if exists "Public read elo history" on public.elo_history;
drop policy if exists "Authenticated read elo history" on public.elo_history;
create policy "Public read elo history" on public.elo_history
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
drop policy if exists "Votes insert elo history" on public.elo_history;
create policy "Votes insert elo history" on public.elo_history
  for insert
  with check (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );

alter table public.profiles enable row level security;
drop policy if exists "Own profile read/write" on public.profiles;
create policy "Own profile read/write" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter table public.reviews enable row level security;
drop policy if exists "Public read published reviews" on public.reviews;
drop policy if exists "Authenticated read published reviews" on public.reviews;
create policy "Public read published reviews" on public.reviews
  for select
  using (
    status = 'published'
    and (
      current_user = 'postgres'
      or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
    )
  );
drop policy if exists "Users manage own reviews" on public.reviews;
create policy "Users manage own reviews" on public.reviews
  for insert
  with check ((select auth.uid()) = author_id);
drop policy if exists "Users update own reviews" on public.reviews;
drop policy if exists "Admins moderate reviews" on public.reviews;
drop policy if exists "Moderate reviews" on public.reviews;
create policy "Moderate reviews" on public.reviews
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
drop policy if exists "Admins delete reviews" on public.reviews;
create policy "Admins delete reviews" on public.reviews
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
    )
  );

alter table public.review_reactions enable row level security;
drop policy if exists "Public read reactions" on public.review_reactions;
drop policy if exists "Authenticated read reactions" on public.review_reactions;
create policy "Public read reactions" on public.review_reactions
  for select
  using (
    current_user = 'postgres'
    or coalesce((select auth.role()), 'anon') in ('anon', 'authenticated', 'service_role')
  );
drop policy if exists "Users manage reactions" on public.review_reactions;
drop policy if exists "Users insert reactions" on public.review_reactions;
drop policy if exists "Users delete reactions" on public.review_reactions;
create policy "Users insert reactions" on public.review_reactions
  for insert
  with check ((select auth.uid()) = user_id);
create policy "Users delete reactions" on public.review_reactions
  for delete
  using ((select auth.uid()) = user_id);
