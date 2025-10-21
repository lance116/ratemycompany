hot or not and ratemyprof but for tech companies

## Vote API hardening

- Supabase Edge Function `vote` verifies hCaptcha before calling `record_matchup`.
- Configure Supabase secrets: `HCAPTCHA_SECRET_KEY`, `ALLOWED_VOTE_ORIGINS` (defaults fall back to built-in `SUPABASE_*` values).
- Frontend env vars: `VITE_SUPABASE_FUNCTION_URL`, `VITE_HCAPTCHA_SITE_KEY`.
