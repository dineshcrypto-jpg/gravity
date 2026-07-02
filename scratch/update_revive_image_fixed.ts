import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../src/lib/supabase.ts';

// New image URL for "Revive Liquid Stiffener"
const newImageUrl = "https://pjqafelkgwupljcqspnv.supabase.co/storage/v1/object/sign/KSN%20super%20store/revive%20liquid%20stiffener%20bottle%20136rs%20400g.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MzhmN2M5OS01MTU2LTRmNWYtYTk5OS1hNmRkNzVmODZlYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJLU04gc3VwZXIgc3RvcmUvcmV2aXZlIGxpcXVpZCBzdGlmZmVuZXIgYm90dGxlIDEzNnJzIDQwMGcuYXZpZiIsImlhdCI6MTc3OTk5MTkxNywiZXhwIjoxODExNTI3OTE3fQ.mgHl56cMwulZhqozFyDUQDizWfhxNMwX7xY6kXu14iA";

async function updateProductImage() {
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: newImageUrl })
    .eq('name', 'Revive Liquid Stiffener')
    .select();

  if (error) {
    console.error('Failed to update image URL:', error);
  } else {
    console.log('Successfully updated product image:', data);
  }
}

updateProductImage();
