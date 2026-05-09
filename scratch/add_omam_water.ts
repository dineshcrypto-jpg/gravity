import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addOmamWater() {
  const categoryId = 'dde0e507-67da-4ec7-b279-32112d1f56d7'; // Groceries & Staples
  
  console.log('Adding Peacock Brand Omam Water to category:', categoryId);

  // 1. Add Product
  const { data: product, error: pError } = await supabase
    .from('products')
    .insert([
      {
        name: 'Peacock Brand Omam Water',
        category_id: categoryId,
        description: 'Traditional Omam Water for digestive relief and wellness.',
        price: 20, // Base price for smallest variety
        weight: '300ml',
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
      name: 'Small Bottle',
      label: '300ml',
      price: 20,
      weight: '300ml'
    },
    {
      product_id: product.id,
      name: 'Large Bottle',
      label: '600ml',
      price: 40,
      weight: '600ml'
    }
  ];

  const { data: vData, error: vError } = await supabase
    .from('varieties')
    .insert(varieties);

  if (vError) {
    console.error('Error adding varieties:', vError);
  } else {
    console.log('Successfully added 2 Omam Water varieties!');
  }
}

addOmamWater();
