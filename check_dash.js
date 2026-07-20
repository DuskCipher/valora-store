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
  envs.SUPABASE_SERVICE_ROLE_KEY || envs.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: stores } = await supabase.from('stores').select('*');
  console.log('Stores:', stores);
  
  const { data: products } = await supabase.from('products').select('id, name, store_id, is_active');
  console.log('Total Products:', products?.length);
  
  const { data: txs } = await supabase.from('transactions').select('*').eq('type', 'order');
  console.log('Total order transactions:', txs?.length);
}
check();
