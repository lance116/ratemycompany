-- Fix permissions for profiles and reviews tables
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/krojodtkkayrjlsdgmcn/sql/new

grant select on public.profiles to anon, authenticated;
grant select on public.profiles to service_role;
