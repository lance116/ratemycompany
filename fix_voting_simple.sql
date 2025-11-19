-- Simple approach: Just replace the function, don't try to drop anything
CREATE OR REPLACE FUNCTION public.record_matchup(
  company_a uuid,
  company_b uuid,
  result text,
  submitted_by uuid DEFAULT NULL::uuid,
  k_factor integer DEFAULT 32,
  voter_ip text DEFAULT NULL::text
)
RETURNS TABLE(
  company_id uuid,
  rating numeric,
  rank bigint,
  matches_played integer,
  wins integer,
  losses integer,
  draws integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rating_a NUMERIC;
  rating_b NUMERIC;
  expected_a NUMERIC;
  expected_b NUMERIC;
  new_rating_a NUMERIC;
  new_rating_b NUMERIC;
  k_a INTEGER;
  k_b INTEGER;
  score_a NUMERIC;
  score_b NUMERIC;
  ip_vote_count INTEGER;
  ip_company_vote_count INTEGER;
  user_vote_count INTEGER;
  matchup_vote_count INTEGER;
  recent_draw_count INTEGER;
BEGIN
  -- Validate result
  IF result NOT IN ('a', 'b', 'draw') THEN
    RAISE EXCEPTION 'Invalid result. Must be a, b, or draw';
  END IF;

  -- Rate limiting checks
  IF voter_ip IS NOT NULL THEN
    -- Check IP-based rate limit (12 votes per 10 minutes)
    SELECT COUNT(*) INTO ip_vote_count
    FROM matchups m
    WHERE m.ip_address::text = voter_ip
      AND m.created_at > NOW() - INTERVAL '10 minutes';

    IF ip_vote_count >= 12 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many votes from this IP. Please wait 10 minutes.';
    END IF;

    -- Check per-company IP rate limit (6 votes per IP per company per 24 hours)
    SELECT COUNT(*) INTO ip_company_vote_count
    FROM matchups m
    WHERE m.ip_address::text = voter_ip
      AND (m.company_a = record_matchup.company_a OR m.company_b = record_matchup.company_a
           OR m.company_a = record_matchup.company_b OR m.company_b = record_matchup.company_b)
      AND m.created_at > NOW() - INTERVAL '24 hours';

    IF ip_company_vote_count >= 6 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many votes for this company from your IP in the last 24 hours.';
    END IF;

    -- Check matchup-specific rate limit (40 votes per matchup per 90 seconds)
    SELECT COUNT(*) INTO matchup_vote_count
    FROM matchups m
    WHERE ((m.company_a = record_matchup.company_a AND m.company_b = record_matchup.company_b)
           OR (m.company_a = record_matchup.company_b AND m.company_b = record_matchup.company_a))
      AND m.created_at > NOW() - INTERVAL '90 seconds';

    IF matchup_vote_count >= 40 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many votes for this matchup. Please try again later.';
    END IF;

    -- Check for consecutive draw spam (max 2 consecutive draws)
    IF result = 'draw' THEN
      SELECT COUNT(*) INTO recent_draw_count
      FROM (
        SELECT m.winner
        FROM matchups m
        WHERE m.ip_address::text = voter_ip
        ORDER BY m.created_at DESC
        LIMIT 2
      ) recent_votes
      WHERE recent_votes.winner = 'draw';

      IF recent_draw_count >= 2 THEN
        RAISE EXCEPTION 'Draw spam detected: Please vote for a winner.';
      END IF;
    END IF;
  END IF;

  -- Check authenticated user rate limit (15 votes per 6 hours)
  IF submitted_by IS NOT NULL THEN
    SELECT COUNT(*) INTO user_vote_count
    FROM matchups m
    WHERE m.submitted_by = record_matchup.submitted_by
      AND m.created_at > NOW() - INTERVAL '6 hours';

    IF user_vote_count >= 15 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many votes from this account. Please wait 6 hours.';
    END IF;
  END IF;

  -- Lock rows for update
  SELECT rating INTO rating_a FROM company_elo WHERE company_id = company_a FOR UPDATE;
  SELECT rating INTO rating_b FROM company_elo WHERE company_id = company_b FOR UPDATE;

  -- Calculate expected scores
  expected_a := 1.0 / (1.0 + POWER(10, (rating_b - rating_a) / 400.0));
  expected_b := 1.0 / (1.0 + POWER(10, (rating_a - rating_b) / 400.0));

  -- Determine actual scores
  IF result = 'a' THEN
    score_a := 1.0;
    score_b := 0.0;
  ELSIF result = 'b' THEN
    score_a := 0.0;
    score_b := 1.0;
  ELSE
    score_a := 0.5;
    score_b := 0.5;
  END IF;

  -- Calculate individual K-factors based on each player's rating
  k_a := k_factor;
  k_b := k_factor;

  IF rating_a >= 2800 THEN
    k_a := 10;
  ELSIF rating_a >= 2600 THEN
    k_a := 12;
  ELSIF rating_a >= 2400 THEN
    k_a := 16;
  END IF;

  IF rating_b >= 2800 THEN
    k_b := 10;
  ELSIF rating_b >= 2600 THEN
    k_b := 12;
  ELSIF rating_b >= 2400 THEN
    k_b := 16;
  END IF;

  -- Calculate new ratings
  new_rating_a := rating_a + k_a * (score_a - expected_a);
  new_rating_b := rating_b + k_b * (score_b - expected_b);

  -- Apply rating caps (800 min, 3100 max)
  new_rating_a := LEAST(GREATEST(new_rating_a, 800), 3100);
  new_rating_b := LEAST(GREATEST(new_rating_b, 800), 3100);

  -- Update company A
  UPDATE company_elo
  SET
    rating = new_rating_a,
    matches_played = matches_played + 1,
    wins = CASE WHEN result = 'a' THEN wins + 1 ELSE wins END,
    losses = CASE WHEN result = 'b' THEN losses + 1 ELSE losses END,
    draws = CASE WHEN result = 'draw' THEN draws + 1 ELSE draws END,
    updated_at = NOW()
  WHERE company_id = company_a;

  -- Update company B
  UPDATE company_elo
  SET
    rating = new_rating_b,
    matches_played = matches_played + 1,
    wins = CASE WHEN result = 'b' THEN wins + 1 ELSE wins END,
    losses = CASE WHEN result = 'a' THEN losses + 1 ELSE losses END,
    draws = CASE WHEN result = 'draw' THEN draws + 1 ELSE draws END,
    updated_at = NOW()
  WHERE company_id = company_b;

  -- Record matchup
  INSERT INTO matchups (
    company_a,
    company_b,
    winner,
    submitted_by,
    ip_address,
    before_rating_a,
    before_rating_b,
    after_rating_a,
    after_rating_b
  ) VALUES (
    company_a,
    company_b,
    result,
    submitted_by,
    voter_ip::inet,
    rating_a,
    rating_b,
    new_rating_a,
    new_rating_b
  );

  -- Record Elo history
  INSERT INTO elo_history (company_id, rating, rank, matchup_id)
  SELECT
    ce.company_id,
    ce.rating,
    DENSE_RANK() OVER (ORDER BY ce.rating DESC),
    (SELECT id FROM matchups ORDER BY created_at DESC LIMIT 1)
  FROM company_elo ce
  WHERE ce.company_id IN (company_a, company_b);

  -- Return updated company data
  RETURN QUERY
  SELECT
    ce.company_id,
    ce.rating,
    DENSE_RANK() OVER (ORDER BY ce.rating DESC) as rank,
    ce.matches_played,
    ce.wins,
    ce.losses,
    ce.draws
  FROM company_elo ce
  WHERE ce.company_id IN (company_a, company_b)
  ORDER BY ce.company_id = company_a DESC;
END;
$$;

-- Grant execute permissions
REVOKE EXECUTE ON FUNCTION public.record_matchup FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_matchup TO service_role;
