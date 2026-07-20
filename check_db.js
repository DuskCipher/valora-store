require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const [f] = await Promise.all([
    s.from('store_followers').select('*').limit(1)
  ]);
  console.log('Followers:', f.error ? f.error.message : 'Exists');
}
run();
