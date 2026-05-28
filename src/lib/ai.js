import { supabase } from './supabase'

export async function summarizeText(text) {
  const { data, error } = await supabase.functions.invoke('ai', {
    body: { type: 'summarize', text },
  })
  if (error) throw error
  return data
}

export async function generateDraft(log) {
  const { data, error } = await supabase.functions.invoke('ai', {
    body: { type: 'draft', log },
  })
  if (error) throw error
  return data
}
