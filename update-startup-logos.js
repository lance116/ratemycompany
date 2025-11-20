// Update startup logos to use local files
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

// Get all PNG files from public folder
const publicFiles = readdirSync('./public').filter(f => f.endsWith('.png') || f.endsWith('.svg'));

// Create mapping of company names to logo files
const logoMap = {
  'A0.dev': 'a0-dev.png',
  'Abacus AI': 'abacus-ai.png',
  'Ada': 'ada.png',
  'Adept': 'adept.png',
  'Airbyte': 'airbyte.png',
  'Algolia': 'algolia.png',
  'Anduril': 'anduril.png',
  'BaseHub': 'basehub.png',
  'BenchSci': 'benchsci.png',
  'Brex': 'brex.png',
  'Buildkite': 'buildkite.png',
  'Cal.com': 'cal-com.png',
  'Character.ai': 'character-ai.png',
  'Chime': 'chime.png',
  'Clerk': 'clerk.png',
  'Clio': 'clio.png',
  'Convex': 'convex.png',
  'Cron': 'cron.png',
  'Deel': 'deel.png',
  'ElevenLabs': 'elevenlabs.png',
  'Figma': 'figma.png',
  'Fixie': 'fixie.png',
  'Flightcontrol': 'flightcontrol.png',
  'Float': 'float.png',
  'Fly.io': 'fly-io.png',
  'Gusto': 'gusto.png',
  'Harvey': 'harvey.png',
  'Height': 'height.png',
  'Inflection AI': 'inflection-ai.png',
  'Inngest': 'inngest.png',
  'Koho': 'koho.png',
  'Linear': 'linear.png',
  'Loom': 'loom.png',
  'Mercury': 'mercury.png',
  'Meticulous': 'meticulous.png',
  'Mintlify': 'mintlify.png',
  'Miro': 'miro.png',
  'Modern Treasury': 'modern-treasury.png',
  'Monzo': 'monzo.png',
  'Navan': 'navan.png',
  'Neo Financial': 'neo-financial.png',
  'Notion': 'notion.png',
  'OneSchema': 'oneschema.png',
  'Pinecone': 'pinecone.png',
  'Pinterest': 'pinterest.png',
  'Pipe': 'pipe.png',
  'Pitch': 'pitch.png',
  'PlanetScale': 'planetscale.png',
  'PostHog': 'posthog.png',
  'Prisma': 'prisma.png',
  'Properly': 'properly.png',
  'Pulumi': 'pulumi.png',
  'Railway': 'railway.png',
  'Raycast': 'raycast.png',
  'Render': 'render.png',
  'Retool': 'retool.png',
  'Runway': 'runway.png',
  'Stytch': 'stytch.png',
  'Supabase': 'supabase.png',
  'Superhuman': 'superhuman.png',
  'Synctera': 'synctera.png',
  'Tailscale': 'tailscale.png',
  'Tana': 'tana.png',
  'Temporal': 'temporal.png',
  'Vitally': 'vitally.png',
  'Wealthsimple': 'wealthsimple.png',
  'Weaviate': 'weaviate.png',
  'Webflow': 'webflow.png',
  'Wise': 'wise.png',
  'Zapier': 'zapier.png',
  'Zed': 'zed.png',
  'SpaceX': 'spacex.png',
  'LinkedIn': 'linkedin.png',
  'Uber': 'uber.png'
};

async function updateLogos() {
  console.log('\nUpdating startup logos to use local files...\n');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [companyName, logoFile] of Object.entries(logoMap)) {
    const localPath = `/${logoFile}`;

    // Check if file exists
    if (!publicFiles.includes(logoFile)) {
      console.log(`⚠️  Skipping ${companyName} - file not found: ${logoFile}`);
      skipped++;
      continue;
    }

    // Update the database
    const { data, error } = await supabase
      .from('startup_companies')
      .update({ logo_url: localPath })
      .eq('name', companyName)
      .select();

    if (error) {
      console.log(`❌ Error updating ${companyName}:`, error.message);
      errors++;
    } else if (data && data.length > 0) {
      console.log(`✅ Updated ${companyName} → ${localPath}`);
      updated++;
    } else {
      console.log(`⚠️  Company not found: ${companyName}`);
      skipped++;
    }
  }

  console.log(`\n✨ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

updateLogos();
