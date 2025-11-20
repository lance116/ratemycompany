// List all startup logo URLs
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

async function listLogos() {
  const { data, error } = await supabase
    .from('startup_companies')
    .select('name, logo_url')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nAll startup logos:\n');
  data?.forEach(c => {
    console.log(`${c.name.padEnd(25)} → ${c.logo_url || 'NULL'}`);
  });
}

listLogos();
