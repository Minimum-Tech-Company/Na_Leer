import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, adminUnauthorized } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return adminUnauthorized()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, status, payment_status, created_at, client:clients(name, email), user:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data })
}
