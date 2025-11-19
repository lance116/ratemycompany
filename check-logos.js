// Quick script to check logo URLs in the database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogos() {
  // Check companies (startups)
  const { data: startups, error: startupsError } = await supabase
    .from('companies')
    .select('name, logo_url')
    .order('name');

  if (startupsError) {
    console.error('Error fetching startups:', startupsError);
  } else {
    console.log('\n=== STARTUPS (companies table) ===');
    console.log(`Total: ${startups?.length || 0}`);
    const withLogos = startups?.filter(c => c.logo_url) || [];
    const withoutLogos = startups?.filter(c => !c.logo_url) || [];
    console.log(`With logos: ${withLogos.length}`);
    console.log(`Without logos: ${withoutLogos.length}`);

    if (withoutLogos.length > 0) {
      console.log('\nCompanies missing logos:');
      withoutLogos.forEach(c => console.log(`  - ${c.name}`));
    }

    if (withLogos.length > 0) {
      console.log('\nSample logo URLs:');
      withLogos.slice(0, 10).forEach(c => console.log(`  ${c.name}: ${c.logo_url}`));
    }
  }
}

checkLogos();
