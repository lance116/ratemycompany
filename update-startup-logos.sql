-- Update startup_companies table to use local logo files
-- Run this in Supabase SQL Editor

UPDATE startup_companies SET logo_url = '/a0-dev.png' WHERE name = 'A0.dev';
UPDATE startup_companies SET logo_url = '/abacus-ai.png' WHERE name = 'Abacus AI';
UPDATE startup_companies SET logo_url = '/ada.png' WHERE name = 'Ada';
UPDATE startup_companies SET logo_url = '/adept.png' WHERE name = 'Adept';
UPDATE startup_companies SET logo_url = '/airbyte.png' WHERE name = 'Airbyte';
UPDATE startup_companies SET logo_url = '/algolia.png' WHERE name = 'Algolia';
UPDATE startup_companies SET logo_url = '/anduril.png' WHERE name = 'Anduril';
UPDATE startup_companies SET logo_url = '/basehub.png' WHERE name = 'BaseHub';
UPDATE startup_companies SET logo_url = '/benchsci.png' WHERE name = 'BenchSci';
UPDATE startup_companies SET logo_url = '/brex.png' WHERE name = 'Brex';
UPDATE startup_companies SET logo_url = '/buildkite.png' WHERE name = 'Buildkite';
UPDATE startup_companies SET logo_url = '/cal-com.png' WHERE name = 'Cal.com';
UPDATE startup_companies SET logo_url = '/character-ai.png' WHERE name = 'Character.ai';
UPDATE startup_companies SET logo_url = '/chime.png' WHERE name = 'Chime';
UPDATE startup_companies SET logo_url = '/clerk.png' WHERE name = 'Clerk';
UPDATE startup_companies SET logo_url = '/clio.png' WHERE name = 'Clio';
UPDATE startup_companies SET logo_url = '/convex.png' WHERE name = 'Convex';
UPDATE startup_companies SET logo_url = '/cron.png' WHERE name = 'Cron';
UPDATE startup_companies SET logo_url = '/deel.png' WHERE name = 'Deel';
UPDATE startup_companies SET logo_url = '/elevenlabs.png' WHERE name = 'ElevenLabs';
UPDATE startup_companies SET logo_url = '/figma.png' WHERE name = 'Figma';
UPDATE startup_companies SET logo_url = '/fixie.png' WHERE name = 'Fixie';
UPDATE startup_companies SET logo_url = '/flightcontrol.png' WHERE name = 'Flightcontrol';
UPDATE startup_companies SET logo_url = '/float.png' WHERE name = 'Float';
UPDATE startup_companies SET logo_url = '/fly-io.png' WHERE name = 'Fly.io';
UPDATE startup_companies SET logo_url = '/gusto.png' WHERE name = 'Gusto';
UPDATE startup_companies SET logo_url = '/harvey.png' WHERE name = 'Harvey';
UPDATE startup_companies SET logo_url = '/height.png' WHERE name = 'Height';
UPDATE startup_companies SET logo_url = '/inflection-ai.png' WHERE name = 'Inflection AI';
UPDATE startup_companies SET logo_url = '/inngest.png' WHERE name = 'Inngest';
UPDATE startup_companies SET logo_url = '/koho.png' WHERE name = 'Koho';
UPDATE startup_companies SET logo_url = '/linear.png' WHERE name = 'Linear';
UPDATE startup_companies SET logo_url = '/loom.png' WHERE name = 'Loom';
UPDATE startup_companies SET logo_url = '/mercury.png' WHERE name = 'Mercury';
UPDATE startup_companies SET logo_url = '/meticulous.png' WHERE name = 'Meticulous';
UPDATE startup_companies SET logo_url = '/mintlify.png' WHERE name = 'Mintlify';
UPDATE startup_companies SET logo_url = '/miro.png' WHERE name = 'Miro';
UPDATE startup_companies SET logo_url = '/modern-treasury.png' WHERE name = 'Modern Treasury';
UPDATE startup_companies SET logo_url = '/monzo.png' WHERE name = 'Monzo';
UPDATE startup_companies SET logo_url = '/navan.png' WHERE name = 'Navan';
UPDATE startup_companies SET logo_url = '/neo-financial.png' WHERE name = 'Neo Financial';
UPDATE startup_companies SET logo_url = '/notion.png' WHERE name = 'Notion';
UPDATE startup_companies SET logo_url = '/oneschema.png' WHERE name = 'OneSchema';
UPDATE startup_companies SET logo_url = '/pinecone.png' WHERE name = 'Pinecone';
UPDATE startup_companies SET logo_url = '/pipe.png' WHERE name = 'Pipe';
UPDATE startup_companies SET logo_url = '/pitch.png' WHERE name = 'Pitch';
UPDATE startup_companies SET logo_url = '/planetscale.png' WHERE name = 'PlanetScale';
UPDATE startup_companies SET logo_url = '/posthog.png' WHERE name = 'PostHog';
UPDATE startup_companies SET logo_url = '/prisma.png' WHERE name = 'Prisma';
UPDATE startup_companies SET logo_url = '/properly.png' WHERE name = 'Properly';
UPDATE startup_companies SET logo_url = '/pulumi.png' WHERE name = 'Pulumi';
UPDATE startup_companies SET logo_url = '/railway.png' WHERE name = 'Railway';
UPDATE startup_companies SET logo_url = '/raycast.png' WHERE name = 'Raycast';
UPDATE startup_companies SET logo_url = '/render.png' WHERE name = 'Render';
UPDATE startup_companies SET logo_url = '/retool.png' WHERE name = 'Retool';
UPDATE startup_companies SET logo_url = '/runway.png' WHERE name = 'Runway';
UPDATE startup_companies SET logo_url = '/stytch.png' WHERE name = 'Stytch';
UPDATE startup_companies SET logo_url = '/supabase.png' WHERE name = 'Supabase';
UPDATE startup_companies SET logo_url = '/superhuman.png' WHERE name = 'Superhuman';
UPDATE startup_companies SET logo_url = '/synctera.png' WHERE name = 'Synctera';
UPDATE startup_companies SET logo_url = '/tailscale.png' WHERE name = 'Tailscale';
UPDATE startup_companies SET logo_url = '/tana.png' WHERE name = 'Tana';
UPDATE startup_companies SET logo_url = '/temporal.png' WHERE name = 'Temporal';
UPDATE startup_companies SET logo_url = '/vitally.png' WHERE name = 'Vitally';
UPDATE startup_companies SET logo_url = '/wealthsimple.png' WHERE name = 'Wealthsimple';
UPDATE startup_companies SET logo_url = '/weaviate.png' WHERE name = 'Weaviate';
UPDATE startup_companies SET logo_url = '/webflow.png' WHERE name = 'Webflow';
UPDATE startup_companies SET logo_url = '/wise.png' WHERE name = 'Wise';
UPDATE startup_companies SET logo_url = '/zapier.png' WHERE name = 'Zapier';
UPDATE startup_companies SET logo_url = '/zed.png' WHERE name = 'Zed';
UPDATE startup_companies SET logo_url = '/spacex.png' WHERE name = 'SpaceX';

-- Note: Companies without local logos will keep Clearbit URLs:
-- Anthropic, Affirm, Cloudflare, Coda, Cohere, Cursor, Databricks, Datacurve,
-- Glean, HashiCorp, LangChain, Mistral AI, OpenAI, OpenPipe, Perplexity, Plaid,
-- Ramp, Replit, Rippling, Scale AI, Sentry, Stability AI, Stripe, SupaModal, Vercel
