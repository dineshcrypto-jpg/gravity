import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkVarietiesPolicy() {
  console.log('Attempting to insert a test variety...')
  const { data, error } = await supabase.from('varieties').insert([{ product_id: 'a84ce412-df5a-4f1f-bc08-1db4f6bdee7e', name: 'Test', price: 0 }])
  if (error) console.error('Variety insert error:', error)
  else console.log('Variety insert success:', data)
}

checkVarietiesPolicy()
