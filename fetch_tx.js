const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zmerpcmxxfeqxzgqvsgh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZXJwY214eGZlcXh6Z3F2c2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODE4MTAsImV4cCI6MjA5OTg1NzgxMH0.vaHhWAQAe8qEZmNOiG6fPe-AFFCxNA6FC7oC34YGCDU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: transactions } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20);
  fs.writeFileSync('output_tx.json', JSON.stringify(transactions, null, 2));
}

check();
