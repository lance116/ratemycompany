-- Restrict record_matchup access to server-side contexts

revoke execute on function public.record_matchup(uuid, uuid, text, uuid, numeric, inet)
from public, anon, authenticated;

grant execute on function public.record_matchup(uuid, uuid, text, uuid, numeric, inet)
to service_role;
