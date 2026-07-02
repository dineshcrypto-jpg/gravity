import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url');
    
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log('Checking all products with Supabase image URLs:');
  for (const product of products) {
    if (product.image_url && product.image_url.includes('supabase.co')) {
      try {
        const res = await fetch(product.image_url);
        console.log(`- ${product.name}: Status ${res.status}`);
        if (res.status !== 200) {
          const body = await res.text();
          console.log(`  Error: ${body.slice(0, 150)}`);
        }
      } catch (err) {
        console.log(`- ${product.name}: Fetch error:`, err);
      }
    }
  }
  
  // Also check varieties
  const { data: varieties, error: vError } = await supabase
    .from('varieties')
    .select('id, name, image_url, products(name)');
    
  if (vError) {
    console.error('Error fetching varieties:', vError);
    return;
  }
  
  console.log('\nChecking all varieties with Supabase image URLs:');
  for (const variety of varieties) {
    if (variety.image_url && variety.image_url.includes('supabase.co')) {
      try {
        const res = await fetch(variety.image_url);
        console.log(`- ${variety.products?.name || 'Unknown'} (${variety.name}): Status ${res.status}`);
        if (res.status !== 200) {
          const body = await res.text();
          console.log(`  Error: ${body.slice(0, 150)}`);
        }
      } catch (err) {
        console.log(`- ${variety.products?.name || 'Unknown'} (${variety.name}): Fetch error:`, err);
      }
    }
  }
}

run();
