import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, adminUnauthorized } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return adminUnauthorized()

  const supabase = createAdminClient()

  const [usersCount, invoicesCount, paymentsSum, subsCount, recentInvoices, recentPayments] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'completed'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('invoices').select('id, invoice_number, total, status, created_at, client:clients(name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('payments').select('id, amount, currency, method, status, created_at, user:profiles(full_name, email)').order('created_at', { ascending: false }).limit(10),
  ])

  return NextResponse.json({
    totalUsers: usersCount.count || 0,
    totalInvoices: invoicesCount.count || 0,
    totalRevenue: paymentsSum.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    activeSubscriptions: subsCount.count || 0,
    recentInvoices: recentInvoices.data || [],
    recentPayments: recentPayments.data || [],
  })
}
