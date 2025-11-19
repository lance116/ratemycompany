-- Check if there are companies in the database
-- Run in Supabase Dashboard SQL Editor

SELECT COUNT(*) as company_count FROM public.companies;

-- Check if company_elo has data
SELECT COUNT(*) as elo_count FROM public.company_elo;

-- Try to query the leaderboard view
SELECT * FROM public.company_leaderboard LIMIT 5;
