import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function validateApiKey(request: Request): Promise<{ valid: boolean; user_id?: string; error?: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Token Bearer requis dans le header Authorization' }
  }

  const token = authHeader.substring(7)
  if (!token.startsWith('nkl_')) {
    return { valid: false, error: 'Format de clé API invalide' }
  }

  const tokenHash = hashKey(token)

  const supabase = await createClient()

  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', tokenHash)
    .single()

  if (!apiKey) {
    return { valid: false, error: 'Clé API invalide' }
  }

  if (!apiKey.is_active) {
    return { valid: false, error: 'Clé API désactivée' }
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', tokenHash)

  return { valid: true, user_id: apiKey.user_id }
}
