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
  const { data: txs } = await supabase.from('transactions').select('type');
  console.log('Tx types:', [...new Set(txs?.map(t => t.type) || [])]);
  
  const { data: allTxs } = await supabase.from('transactions').select('*');
  console.log('Total tx count:', allTxs?.length);
}
check();
