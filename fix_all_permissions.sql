-- Comprehensive permission fix for all tables needed by leaderboard views
-- Run this in Supabase Dashboard SQL Editor

-- Core tables
grant select on public.companies to anon, authenticated, service_role;
grant select on public.company_elo to anon, authenticated, service_role;
grant select on public.matchups to anon, authenticated, service_role;
grant select on public.elo_history to anon, authenticated, service_role;

-- User and review tables
grant select on public.profiles to anon, authenticated, service_role;
grant select on public.reviews to anon, authenticated, service_role;
grant select on public.review_reactions to anon, authenticated, service_role;

-- Views
grant select on public.company_leaderboard to anon, authenticated, service_role;
grant select on public.company_reviews_with_meta to anon, authenticated, service_role;
