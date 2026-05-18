import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findSemai() {
  const terms = ['Semai', 'Semiya', 'Vermicelli', 'Standard']
  for (const term of terms) {
    console.log(`\nSearching for "${term}"...`)
    const { data: products } = await supabase.from('products').select('*').ilike('name', `%${term}%`)
    if (products?.length) console.log(`Products (${term}):`, products)

    const { data: varieties } = await supabase.from('varieties').select('*, products(name)').ilike('name', `%${term}%`)
    if (varieties?.length) console.log(`Varieties (${term}):`, varieties)
  }
}

findSemai()
