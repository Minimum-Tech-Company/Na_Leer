import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasFeature } from '@/lib/subscription'
import crypto from 'crypto'

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, expires_at, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Check Business plan
  const canAccess = await hasFeature(user.id, 'has_api_access')
  if (!canAccess) {
    return NextResponse.json({ error: 'L\'accès API nécessite le plan Business' }, { status: 403 })
  }

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  // Generate API key
  const rawKey = `nkl_${crypto.randomBytes(32).toString('hex')}`
  const keyHash = hashKey(rawKey)
  const keyPrefix = rawKey.substring(0, 12) + '...'

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the raw key only on creation
  return NextResponse.json({ key: apiKey, raw_key: rawKey })
}
