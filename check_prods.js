const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envs = fs.readFileSync('d:/zaystore/.env.local', 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
    return acc;
  }, {});

const supabase = createClient(
  envs.NEXT_PUBLIC_SUPABASE_URL,
  envs.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: p } = await supabase.from('products').select('store_id, name');
  console.log('Products:', p);
}
check();
