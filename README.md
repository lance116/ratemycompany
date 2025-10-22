hot or not and ratemyprof but for tech companies

## Vote API hardening

- Supabase Edge Function `vote` verifies hCaptcha before calling `record_matchup`.
- Configure Supabase secrets: `HCAPTCHA_SECRET_KEY`, `ALLOWED_VOTE_ORIGINS`, `VOTE_SESSION_SECRET` (random 32+ chars, used to mint vote session tokens; optional `VOTE_SESSION_TTL` overrides the 1-hour default). Local development is permitted from `http://localhost:8080`.
- Frontend env vars: `VITE_SUPABASE_FUNCTION_URL`, `VITE_HCAPTCHA_SITE_KEY`.
