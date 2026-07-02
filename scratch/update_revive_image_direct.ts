import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env vars missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newImageUrl = "https://pjqafelkgwupljcqspnv.supabase.co/storage/v1/object/sign/KSN%20super%20store/revive%20liquid%20stiffener%20bottle%20136rs%20400g.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MzhmN2M5OS01MTU2LTRmNWYtYTk5OS1hNmRkNzVmODZlYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJLU04gc3VwZXIgc3RvcmUvcmV2aXZlIGxpcXVpZCBzdGlmZmVuZXIgYm90dGxlIDEzNnJzIDQwMGcuYXZpZiIsImlhdCI6MTc3OTk5MTkxNywiZXhwIjoxODExNTI3OTE3fQ.mgHl56cMwulZhqozFyDUQDizWfhxNMwX7xY6kXu14iA";

async function update() {
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: newImageUrl })
    .eq('name', 'Revive Liquid Stiffener')
    .select();
  if (error) {
    console.error('Update error:', error);
  } else {
    console.log('Update success:', data);
  }
}

update();
