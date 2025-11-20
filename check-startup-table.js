// Check startup_companies table logo URLs
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

async function checkStartups() {
  const { data, error } = await supabase
    .from('startup_companies')
    .select('name, logo_url')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== STARTUP_COMPANIES TABLE ===');
  console.log(`Total: ${data?.length || 0}`);

  const withLogos = data?.filter(c => c.logo_url) || [];
  const withoutLogos = data?.filter(c => !c.logo_url) || [];

  console.log(`With logos: ${withLogos.length}`);
  console.log(`Without logos: ${withoutLogos.length}\n`);

  if (withoutLogos.length > 0) {
    console.log('Startups WITHOUT logos:');
    withoutLogos.forEach(c => console.log(`  - ${c.name}`));
  }
}

checkStartups();
