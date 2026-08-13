import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit

  const { data, count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.user_id!)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const supabase = await createClient()
  const body = await request.json()

  const { name, email, phone, address, city, country, tax_id } = body

  if (!name) {
    return NextResponse.json({ error: 'Nom du client requis' }, { status: 400 })
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      user_id: auth.user_id!,
      name,
      email,
      phone,
      address,
      city,
      country,
      tax_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: client }, { status: 201 })
}
