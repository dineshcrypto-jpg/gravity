import { supabase } from '@/lib/supabase';

async function checkReviveImage() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image_url')
    .eq('name', 'Revive Liquid Stiffener')
    .single();

  if (error) {
    console.error('Error fetching product:', error);
  } else {
    console.log('Product fetched:', data);
  }
}

checkReviveImage();
