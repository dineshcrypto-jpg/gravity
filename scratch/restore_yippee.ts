import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function restore() {
  const productId = 'd9d03116-e0da-4a7a-be2e-941e048b72c2'; // The remaining Yippee product
  
  const varieties = [
    {
      product_id: productId,
      name: 'Single Pack',
      label: '1 Unit',
      price: 15,
      weight: '60g'
    },
    {
      product_id: productId,
      name: 'Value Pack',
      label: '4 Units',
      price: 55,
      weight: '240g'
    }
  ];

  console.log('Restoring varieties for product:', productId);

  const { data, error } = await supabase
    .from('varieties')
    .insert(varieties);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully restored 2 varieties!');
  }
}

restore();
