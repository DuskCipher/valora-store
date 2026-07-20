const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let envPath = 'd:/zaystore/.env.local';
if (!fs.existsSync(envPath)) envPath = 'd:/zaystore/.env';

const envs = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace(/\r/g, '');
    return acc;
  }, {});

const supabase = createClient(
  envs.NEXT_PUBLIC_SUPABASE_URL,
  envs.SUPABASE_SERVICE_ROLE_KEY || envs.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncSales() {
  console.log('Fetching all approved order transactions...');
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'order')
    .eq('status', 'approved');

  if (txError) {
    console.error('Failed to fetch txs:', txError);
    return;
  }

  const salesMap = {};
  txs.forEach(t => {
    const items = t.details?.items || [];
    items.forEach(item => {
      const pid = item.product?.id || item.id;
      if (pid) {
        if (!salesMap[pid]) salesMap[pid] = 0;
        salesMap[pid] += (item.quantity || 1);
      }
    });
  });

  console.log('Sales Map computed:', salesMap);

  for (const [pid, count] of Object.entries(salesMap)) {
    console.log(`Updating product ${pid} -> sold = ${count}`);
    const { error } = await supabase
      .from('products')
      .update({ sold: count, downloads: count })
      .eq('id', pid);
    
    if (error) {
      console.error(`Error updating product ${pid}:`, error);
    }
  }

  console.log('Sync complete!');
}

syncSales();
