// Map startup company names to local logo files
// This overrides any external URLs from the database

const STARTUP_LOGO_MAP: Record<string, string> = {
  'A0.dev': '/a0-dev.png',
  'Abacus AI': '/abacus-ai.png',
  'Ada': '/ada.png',
  'Adept': '/adept.png',
  'Airbyte': '/airbyte.png',
  'Algolia': '/algolia.png',
  'Anduril': '/anduril.png',
  'BaseHub': '/basehub.png',
  'BenchSci': '/benchsci.png',
  'Brex': '/brex.png',
  'Buildkite': '/buildkite.png',
  'Cal.com': '/cal-com.png',
  'Character.ai': '/character-ai.png',
  'Chime': '/chime.png',
  'Clerk': '/clerk.png',
  'Clio': '/clio.png',
  'Convex': '/convex.png',
  'Cron': '/cron.png',
  'Deel': '/deel.png',
  'ElevenLabs': '/elevenlabs.png',
  'Figma': '/figma.png',
  'Fixie': '/fixie.png',
  'Flightcontrol': '/flightcontrol.png',
  'Float': '/float.png',
  'Fly.io': '/fly-io.png',
  'Gusto': '/gusto.png',
  'Harvey': '/harvey.png',
  'Height': '/height.png',
  'Inflection AI': '/inflection-ai.png',
  'Inngest': '/inngest.png',
  'Koho': '/koho.png',
  'Linear': '/linear.png',
  'Loom': '/loom.png',
  'Mercury': '/mercury.png',
  'Meticulous': '/meticulous.png',
  'Mintlify': '/mintlify.png',
  'Miro': '/miro.png',
  'Modern Treasury': '/modern-treasury.png',
  'Monzo': '/monzo.png',
  'Navan': '/navan.png',
  'Neo Financial': '/neo-financial.png',
  'Notion': '/notion.png',
  'OneSchema': '/oneschema.png',
  'Pinecone': '/pinecone.png',
  'Pipe': '/pipe.png',
  'Pitch': '/pitch.png',
  'PlanetScale': '/planetscale.png',
  'PostHog': '/posthog.png',
  'Prisma': '/prisma.png',
  'Properly': '/properly.png',
  'Pulumi': '/pulumi.png',
  'Railway': '/railway.png',
  'Raycast': '/raycast.png',
  'Render': '/render.png',
  'Retool': '/retool.png',
  'Runway': '/runway.png',
  'SpaceX': '/spacex.png',
  'Stytch': '/stytch.png',
  'Supabase': '/supabase.png',
  'Superhuman': '/superhuman.png',
  'Synctera': '/synctera.png',
  'Tailscale': '/tailscale.png',
  'Tana': '/tana.png',
  'Temporal': '/temporal.png',
  'Vitally': '/vitally.png',
  'Wealthsimple': '/wealthsimple.png',
  'Weaviate': '/weaviate.png',
  'Webflow': '/webflow.png',
  'Wise': '/wise.png',
  'Zapier': '/zapier.png',
  'Zed': '/zed.png',
};

/**
 * Get the logo URL for a startup company.
 * Prioritizes local files over database URLs.
 */
export function getStartupLogoUrl(companyName: string, fallbackUrl: string | null): string {
  // Check if we have a local logo file for this company
  const localLogo = STARTUP_LOGO_MAP[companyName];
  if (localLogo) {
    return localLogo;
  }

  // Fall back to database URL if available
  if (fallbackUrl) {
    return fallbackUrl;
  }

  // Final fallback to placeholder
  return '/placeholder.svg';
}
