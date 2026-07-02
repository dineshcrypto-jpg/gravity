import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const fileName = 'hit anti roach gel 99rs 15g.avif';
  
  // Create a signed URL valid for 1 year (31,536,000 seconds)
  const { data, error } = await supabase.storage
    .from('KSN super store')
    .createSignedUrl(fileName, 31536000);
    
  if (error) {
    console.error('Error creating signed URL:', error);
  } else {
    console.log('Successfully generated signed URL:', data.signedUrl);
    
    // Test fetch the generated URL to confirm it returns 200 OK
    try {
      const response = await fetch(data.signedUrl);
      console.log('Fetch test status:', response.status);
    } catch (err) {
      console.error('Fetch test failed:', err);
    }
  }
}

run();
