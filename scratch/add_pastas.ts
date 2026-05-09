import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addPastaVarieties() {
  const productId = '276a1c22-3be7-42a6-9ffa-df7617f0336a'; // Existing Pasta product
  
  const newVarieties = [
    {
      product_id: productId,
      name: 'Cheese Macaroni',
      label: 'Cheese Macaroni',
      price: 35
    },
    {
      product_id: productId,
      name: 'Masala Penne',
      label: 'Masala Penne',
      price: 35
    },
    {
      product_id: productId,
      name: 'Mushroom Penne',
      label: 'Mushroom Penne',
      price: 35
    }
  ];

  const { data, error } = await supabase
    .from('varieties')
    .insert(newVarieties);

  if (error) {
    console.error('Error adding varieties:', error);
  } else {
    console.log('Successfully added 3 pasta varieties!');
  }
}

addPastaVarieties();
