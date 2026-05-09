import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const productId = 'd9d03116-e0da-4a7a-be2e-941e048b72c2';
  const { data: varieties } = await supabase.from('varieties').select('*').eq('product_id', productId);
  console.log(JSON.stringify(varieties, null, 2));
}

check();
