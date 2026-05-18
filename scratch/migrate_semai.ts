import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqafelkgwupljcqspnv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcWFmZWxrZ3d1cGxqY3FzcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDIxNTMsImV4cCI6MjA5MzAxODE1M30.xFghqfSgZnhUvs1d9fM596zPAxCWZyYqWmmGp4smPKI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function migrateSemai() {
  const oldVarietyId = '36ce7268-d641-4586-96da-ef65e57fbf3d'
  const categoryId = 'dde0e507-67da-4ec7-b279-32112d1f56d7'
  
  // 1. Create new product
  console.log('Creating new product: Standard Semai...')
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert([
      {
        name: 'Standard Semai',
        category_id: categoryId,
        description: 'Standard quality vermicelli for delicious upma, payasam, and more.',
        image_url: 'https://pjqafelkgwupljcqspnv.supabase.co/storage/v1/object/sign/KSN%20super%20store/semiya%2020rs%20180gm.jfif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MzhmN2M5OS01MTU2LTRmNWYtYTk5OS1hNmRkNzVmODZlYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJLU04gc3VwZXIgc3RvcmUvc2VtaXlhIDIwcnMgMTgwZ20uamZpZiIsImlhdCI6MTc3Nzg5MTE1MSwiZXhwIjoxODA5NDI3MTUxfQ.isjHbxiHho2huDwXhkuZl2-GxNuQNgqVdOE7MSVns2M'
      }
    ])
    .select()
    .single()

  if (productError) {
    console.error('Error creating product:', productError)
    return
  }

  console.log('New product created:', newProduct.id)

  // 2. Move variety to new product
  console.log('Moving variety to new product...')
  const { error: varietyError } = await supabase
    .from('varieties')
    .update({
      product_id: newProduct.id,
      name: 'Standard Pack', // Rename variety if needed, or keep it. User said "Standard Semai verity"
      price: 20,
      weight: '180g',
      label: '180g'
    })
    .eq('id', oldVarietyId)

  if (varietyError) {
    console.error('Error updating variety:', varietyError)
    return
  }

  console.log('Successfully migrated Standard Semai to its own product!')
}

migrateSemai()
