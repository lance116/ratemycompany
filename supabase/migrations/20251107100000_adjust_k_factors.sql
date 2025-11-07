-- Adjust K-factors to be more in line with chess ratings
-- Chess never drops below K=10, but we were dropping to K=4
-- This makes rating changes more meaningful at high ratings

create or replace function public.record_matchup(
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
  effective_k numeric := greatest(1, least(32, coalesce(k_factor, 32)));
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

  if ip_input is not null then
    select count(*) into ip_recent_votes
    from public.matchups m
    where m.ip_address = ip_input
      and m.created_at > now() - interval '10 minutes';

    if ip_recent_votes >= 12 then
      raise exception 'Too many votes from this IP in a short period. Please wait before voting again.';
    end if;

    select count(*) into ip_company_recent
    from public.matchups m
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

  if submitter is not null then
    select count(*) into submitter_recent
    from public.matchups m
    where m.submitted_by = submitter
      and m.created_at > now() - interval '6 hours';

    if submitter_recent >= 15 then
      raise exception 'Account vote limit reached. Please wait before voting again.';
    end if;
  end if;

  if (
    select count(*)
    from public.matchups m
    where m.created_at > now() - interval '90 seconds'
      and (
        m.company_a in (company_a_id, company_b_id)
        or m.company_b in (company_a_id, company_b_id)
      )
  ) >= 40 then
    raise exception 'Too many recent votes for this matchup. Please try again later.';
  end if;

  insert into public.company_elo (company_id)
    values (company_a_id)
    on conflict on constraint company_elo_pkey do nothing;

  insert into public.company_elo (company_id)
    values (company_b_id)
    on conflict on constraint company_elo_pkey do nothing;

  if result = 'draw' then
    if ip_input is not null then
      select count(*) into draw_streak
      from (
        select result
        from public.matchups
        where ip_address = ip_input
        order by created_at desc
        limit 2
      ) recent
      where recent.result = 'draw';
    elsif submitter is not null then
      select count(*) into draw_streak
      from (
        select result
        from public.matchups
        where submitted_by = submitter
        order by created_at desc
        limit 2
      ) recent
      where recent.result = 'draw';
    end if;

    if draw_streak = 2 then
      insert into public.draw_violation_logs (ip_address, submitter, company_a, company_b, violation_count)
      values (ip_input, submitter, company_a_id, company_b_id, draw_streak + 1);
      raise exception 'Draw limit reached for this IP. Please choose a winner.';
    end if;
  end if;

  select ce.rating
  into a_rating
  from public.company_elo ce
  where ce.company_id = company_a_id
  for update of ce;

  select ce.rating
  into b_rating
  from public.company_elo ce
  where ce.company_id = company_b_id
  for update of ce;

  -- Adjusted K-factors more in line with chess
  -- Chess: K=40 for new players, K=20 for active, K=10 for 2400+
  -- We use: K=32 default, gradually reduce but never below K=10

  if greatest(a_rating, b_rating) >= 2400 then
    effective_k := least(effective_k, 16);
  end if;

  if greatest(a_rating, b_rating) >= 2600 then
    effective_k := least(effective_k, 12);
  end if;

  if greatest(a_rating, b_rating) >= 2800 then
    effective_k := least(effective_k, 10);
  end if;

  -- Never drop below K=10 (chess minimum)
  effective_k := greatest(effective_k, 10);

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

  new_a := a_rating + effective_k * (score_a - exp_a);
  new_b := b_rating + effective_k * (score_b - exp_b);

  -- Only apply global min/max caps (800 - 3100)
  new_a := least(3100, greatest(800, new_a));
  new_b := least(3100, greatest(800, new_b));

  -- Company-specific caps removed - all companies follow same rules

  update public.company_elo as ce
    set rating = new_a,
        matches_played = ce.matches_played + 1,
        wins = ce.wins + case when result = 'a' then 1 else 0 end,
        losses = ce.losses + case when result = 'b' then 1 else 0 end,
        draws = ce.draws + case when result = 'draw' then 1 else 0 end,
        updated_at = now()
    where ce.company_id = company_a_id;

  update public.company_elo as ce
    set rating = new_b,
        matches_played = ce.matches_played + 1,
        wins = ce.wins + case when result = 'b' then 1 else 0 end,
        losses = ce.losses + case when result = 'a' then 1 else 0 end,
        draws = ce.draws + case when result = 'draw' then 1 else 0 end,
        updated_at = now()
    where ce.company_id = company_b_id;

  insert into public.matchups (
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

  with ranking as (
    select
      c.id,
      dense_rank() over (order by ce.rating desc, c.created_at asc)::integer as rank
    from public.companies c
    join public.company_elo ce on ce.company_id = c.id
  ),
  updated as (
    select company_a_id as company_id, new_a as rating
    union all
    select company_b_id as company_id, new_b as rating
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
    ranks.rank
  from public.company_elo ce
  join (
    select
      c.id,
      dense_rank() over (order by ce.rating desc, c.created_at asc)::integer as rank
    from public.companies c
    join public.company_elo ce on ce.company_id = c.id
  ) ranks on ranks.id = ce.company_id
  where ce.company_id in (company_a_id, company_b_id);
end;
$$;

-- Re-grant permissions
revoke execute on function public.record_matchup(uuid, uuid, text, uuid, numeric, inet) from public, anon, authenticated;
grant execute on function public.record_matchup(uuid, uuid, text, uuid, numeric, inet) to service_role;
