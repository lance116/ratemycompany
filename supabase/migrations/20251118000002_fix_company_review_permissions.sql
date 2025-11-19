-- Fix permissions for reviews and profiles tables so the company_leaderboard view works
grant select on public.reviews to anon, authenticated;
grant select on public.reviews to service_role;

grant select on public.profiles to anon, authenticated;
grant select on public.profiles to service_role;
