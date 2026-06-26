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

export async function uploadAudio(blob) {
  // 데모 모드: 브라우저 세션 내에서만 유효한 로컬 URL 반환
  if (!supabase) return URL.createObjectURL(blob)
  const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('recordings')
    .upload(filename, blob, { upsert: true, contentType: blob.type })
  if (error) throw error
  const { data } = supabase.storage.from('recordings').getPublicUrl(filename)
  return data.publicUrl
}
