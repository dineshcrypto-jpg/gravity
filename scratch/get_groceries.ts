import { supabase } from '../src/lib/supabase';
async function run() {
  const { data } = await supabase.from('categories').select('*').ilike('name', '%Grocer%');
  console.log(JSON.stringify(data, null, 2));
}
run();
