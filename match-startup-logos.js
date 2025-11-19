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
  'plaid': 'plaid logo',
  // Failed downloads - use placeholder
  'mistral-ai': null,
  'langchain': null,
  'stability-ai': null,
  'datacurve': null,
  'supamodal': null,
  'coda': null,
  'openpipe': null,
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
