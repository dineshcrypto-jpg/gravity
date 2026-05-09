import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addYippee() {
  const categoryId = 'dde0e507-67da-4ec7-b279-32112d1f56d7'; // Groceries & Staples
  
  console.log('Adding Yippee Noodles to category:', categoryId);

  // 1. Add Product
  const { data: product, error: pError } = await supabase
    .from('products')
    .insert([
      {
        name: 'Sunfeast Yippee Noodles',
        category_id: categoryId,
        description: 'Magic Masala Noodles - Long, non-sticky and delicious!',
        price: 15, // Default placeholder
        weight: '60g', // Default placeholder
        is_in_stock: true
      }
    ])
    .select()
    .single();

  if (pError) {
    console.error('Error adding product:', pError);
    return;
  }

  console.log('Successfully added product:', product.name, '(ID:', product.id, ')');

  // 2. Add Varieties
  const varieties = [
    {
      product_id: product.id,
      name: 'Single Pack',
      label: '1 Unit',
      price: 15,
      weight: '60g'
    },
    {
      product_id: product.id,
      name: 'Value Pack',
      label: '4 Units',
      price: 55,
      weight: '240g'
    }
  ];

  const { data: vData, error: vError } = await supabase
    .from('varieties')
    .insert(varieties);

  if (vError) {
    console.error('Error adding varieties:', vError);
  } else {
    console.log('Successfully added 2 Yippee varieties!');
  }
}

addYippee();
