// Check which startups have logo issues
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const startupNames = [
  'A0 Dev', 'Abacus AI', 'Ada', 'Adept', 'Airbyte', 'Algolia', 'Anduril',
  'BaseHub', 'BenchSci', 'Brex', 'Buildkite', 'Cal.com', 'Character.AI',
  'Chime', 'Clerk', 'Clio', 'Convex', 'Cron', 'Deel', 'ElevenLabs',
  'Figma', 'Fixie', 'Flightcontrol', 'Float', 'Fly.io', 'Gusto',
  'Harvey', 'Height', 'Inflection AI', 'Inngest', 'Koho', 'Linear',
  'Loom', 'Mercury', 'Meticulous', 'Mintlify', 'Miro', 'Modern Treasury',
  'Monzo', 'Navan', 'Neo Financial', 'Notion', 'OneSchema', 'Pinecone',
  'Pipe', 'Pitch', 'PlanetScale', 'PostHog', 'Prisma', 'Properly',
  'Pulumi', 'Railway', 'Raycast', 'Render', 'Retool', 'Runway',
  'Stytch', 'Supabase', 'Superhuman', 'Synctera', 'Tailscale', 'Tana',
  'Temporal', 'Vitally', 'Wealthsimple', 'Weaviate', 'Webflow', 'Wise',
  'Zapier', 'Zed'
];

async function checkStartupLogos() {
  const { data, error } = await supabase
    .from('companies')
    .select('name, logo_url')
    .in('name', startupNames);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== STARTUP LOGOS ===\n');

  const withLocalPaths = data?.filter(c => c.logo_url && c.logo_url.startsWith('/')) || [];
  const withExternalUrls = data?.filter(c => c.logo_url && c.logo_url.startsWith('http')) || [];
  const withoutLogos = data?.filter(c => !c.logo_url) || [];

  console.log(`Total startups checked: ${data?.length || 0}`);
  console.log(`With local paths: ${withLocalPaths.length}`);
  console.log(`With external URLs: ${withExternalUrls.length}`);
  console.log(`Without logos: ${withoutLogos.length}`);

  if (withExternalUrls.length > 0) {
    console.log('\nStartups using external URLs (should be local):');
    withExternalUrls.forEach(c => console.log(`  ${c.name}: ${c.logo_url}`));
  }

  if (withoutLogos.length > 0) {
    console.log('\nStartups without logos:');
    withoutLogos.forEach(c => console.log(`  - ${c.name}`));
  }

  console.log('\nSample local paths:');
  withLocalPaths.slice(0, 10).forEach(c => console.log(`  ${c.name}: ${c.logo_url}`));
}

checkStartupLogos();
