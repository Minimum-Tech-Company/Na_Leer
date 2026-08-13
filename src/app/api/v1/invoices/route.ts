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
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('invoices')
    .select('*, client:clients(name, email, phone)', { count: 'exact' })
    .eq('user_id', auth.user_id!)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

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

  const { client_id, invoice_number, issue_date, due_date, items, tax_rate = 0, notes, currency = 'XOF' } = body

  if (!client_id || !items || items.length === 0) {
    return NextResponse.json({ error: 'client_id et items requis' }, { status: 400 })
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
  const tax_amount = subtotal * (tax_rate / 100)
  const total = subtotal + tax_amount

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: auth.user_id!,
      client_id,
      invoice_number,
      issue_date: issue_date || new Date().toISOString().split('T')[0],
      due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal,
      tax_rate,
      tax_amount,
      total,
      notes,
      currency,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert items
  const invoiceItems = items.map((item: any) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
  }))

  await supabase.from('invoice_items').insert(invoiceItems)

  return NextResponse.json({ data: invoice }, { status: 201 })
}
