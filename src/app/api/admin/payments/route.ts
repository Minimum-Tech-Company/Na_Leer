import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, adminUnauthorized } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return adminUnauthorized()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .select('id, amount, currency, method, status, created_at, user:profiles(full_name, email), invoice:invoices(invoice_number)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: data })
}
