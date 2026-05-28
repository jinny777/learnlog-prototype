import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function uploadImage(file) {
  if (!supabase) throw new Error('Supabase가 연결되지 않았습니다.')
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('images')
    .upload(filename, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(filename)
  return data.publicUrl
}
