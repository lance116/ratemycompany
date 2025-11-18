import { readFileSync, writeFileSync, readdirSync } from 'fs';

// Read actual logo files from public directory
const publicFiles = readdirSync('/Users/lance/Documents/ratemycompany/public')
  .filter(f => f.match(/\.(png|svg|webp)$/));

const startupSlugs = readFileSync('/tmp/startup-slugs.txt', 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

console.log(`Found ${publicFiles.length} logo files in public/`);
console.log(`Found ${startupSlugs.length} startup slugs`);

// Create lookup map: basename (without extension) -> full filename
const logoMap = new Map();
publicFiles.forEach(file => {
  const basename = file.replace(/\.(png|svg|webp)$/, '').toLowerCase();
  logoMap.set(basename, file);
});

// Manual mappings for special cases
const specialMappings = {
  'scale-ai': 'scale',
  'mistral-ai': null,  // Not available
  'plaid': 'plaid logo',
  'fixie': null,
  'character-ai': null,
  'abacus-ai': null,
  'inflection-ai': null,
  'datacurve': null,
  'weaviate': null,
  'pinecone': null,
  'planetscale': null,
  'prisma': null,
  'fly-io': null,
  'railway': null,
  'tailscale': null,
  'temporal': null,
  'sentry': null,
  'render': null,
  'clerk': null,
  'posthog': null,
  'retool': null,
  'pulumi': null,
  'algolia': null,
  'buildkite': null,
  'modern-treasury': null,
  'pipe': null,
  'wise': null,
  'chime': null,
  'monzo': null,
  'gusto': null,
  'synctera': null,
  'navan': null,
  'mintlify': null,
  'convex': null,
  'a0-dev': null,
  'zed': null,
  'raycast': null,
  'height': null,
  'cron': null,
  'tana': null,
  'supamodal': null,
  'inngest': null,
  'basehub': null,
  'flightcontrol': null,
  'cal-com': null,
  'meticulous': null,
  'superhuman': null,
  'coda': null,
  'loom': null,
  'pitch': null,
  'miro': null,
  'zapier': null,
  'webflow': null,
  'airbyte': null,
  'vitally': null,
  'stytch': null,
  'openpipe': null,
  'oneschema': null,
  'wealthsimple': null,
  'float': null,
  'neo-financial': null,
  'koho': null,
  'ada': null,
  'clio': null,
  'benchsci': null,
  'properly': null,
  'anduril': null,
  'spacex': null,
};

// Match startups to logos
const matches = [];
const missing = [];

startupSlugs.forEach(slug => {
  // Check special mappings first
  if (slug in specialMappings) {
    const mapped = specialMappings[slug];
    if (mapped && logoMap.has(mapped.toLowerCase())) {
      matches.push({ slug, logo: logoMap.get(mapped.toLowerCase()) });
      return;
    } else if (mapped === null) {
      missing.push(slug);
      return;
    }
  }

  // Try exact match
  const slugLower = slug.toLowerCase();
  if (logoMap.has(slugLower)) {
    matches.push({ slug, logo: logoMap.get(slugLower) });
    return;
  }

  // Try without hyphens
  const slugNoHyphens = slugLower.replace(/-/g, '');
  if (logoMap.has(slugNoHyphens)) {
    matches.push({ slug, logo: logoMap.get(slugNoHyphens) });
    return;
  }

  // Try with spaces instead of hyphens
  const slugSpaces = slugLower.replace(/-/g, ' ');
  if (logoMap.has(slugSpaces)) {
    matches.push({ slug, logo: logoMap.get(slugSpaces) });
    return;
  }

  missing.push(slug);
});

console.log(`\nMatched: ${matches.length}`);
console.log(`Missing: ${missing.length}`);

// Generate SQL migration
let sql = `-- Update startup logos to use local file paths
-- Matched ${matches.length} out of ${startupSlugs.length} startups

`;

matches.forEach(({ slug, logo }) => {
  const logoPath = `/${logo}`;
  sql += `UPDATE startup_companies SET logo_url = '${logoPath}' WHERE slug = '${slug}';\n`;
});

if (missing.length > 0) {
  sql += `\n-- Missing logos (${missing.length}):\n`;
  missing.forEach(slug => {
    sql += `-- ${slug}\n`;
  });
}

// Write migration file
const migrationPath = '/Users/lance/Documents/ratemycompany/supabase/migrations/20251118000003_fix_startup_logo_paths.sql';
writeFileSync(migrationPath, sql);

console.log(`\n✅ Migration written to: ${migrationPath}`);
console.log(`\nMatched logos:`);
matches.slice(0, 10).forEach(({ slug, logo }) => {
  console.log(`  ${slug} → /${logo}`);
});
if (matches.length > 10) {
  console.log(`  ... and ${matches.length - 10} more`);
}

if (missing.length > 0) {
  console.log(`\n⚠️  Missing logos for:`);
  missing.forEach(slug => console.log(`  - ${slug}`));
}
