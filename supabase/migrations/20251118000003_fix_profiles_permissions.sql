-- Fix permissions for profiles table so views can access it
grant select on public.profiles to anon, authenticated;
grant select on public.profiles to service_role;
