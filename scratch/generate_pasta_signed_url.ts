import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data, error } = await supabase.storage
    .from('KSN super store')
    .createSignedUrl('red pasta.jpg', 600);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Signed URL:', data.signedUrl);
    
    // Decode JWT payload
    const token = new URL(data.signedUrl).searchParams.get('token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64').toString();
        console.log('JWT Payload:', payload);
      }
    }
  }
}

run();
