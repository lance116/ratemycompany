-- Fix permissions for startup_reviews table so the startup_leaderboard view works
grant select on public.startup_reviews to anon, authenticated;
grant select on public.startup_reviews to service_role;
