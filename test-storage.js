const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zmerpcmxxfeqxzgqvsgh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZXJwY214eGZlcXh6Z3F2c2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODE4MTAsImV4cCI6MjA5OTg1NzgxMH0.vaHhWAQAe8qEZmNOiG6fPe-AFFCxNA6FC7oC34YGCDU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.storage.getBucket('store-logos');
  console.log('Bucket check:', error || data);

  const fileBody = Buffer.from('hello world', 'utf8');
  
  // Try uploading a test file to public path (without auth)
  // This will probably fail with 403 or 401, but if it gives 400, then we know why.
  const { error: uploadError } = await supabase.storage
    .from('store-logos')
    .upload('test/hello.txt', fileBody, { contentType: 'text/plain', upsert: true });

  console.log('Upload check:', uploadError);
}

test();
