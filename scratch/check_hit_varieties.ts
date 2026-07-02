import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const productId = '8409bb0b-a5a0-429f-839e-a77e102bdb85';
  const { data: varieties, error } = await supabase.from('varieties').select('*').eq('product_id', productId);
  if (error) {
    console.error('Error fetching varieties:', error);
  } else {
    console.log('Varieties for HIT Anti Roach Gel:', JSON.stringify(varieties, null, 2));
  }
}

check();
