const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pjqafelkgwupljcqspnv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'
);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', '%ujala%');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
