import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, status, metadata } = body

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })
    }

    const supabase = await createClient()

    let meta: Record<string, any> = {}
    if (metadata) {
      try {
        meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
      } catch {
        // ignore
      }
    }

    const isSuccess = status === 'SUCCESS' || status === 'ACCEPTED'
    const isFailed = status === 'REFUSED' || status === 'CANCELED'

    if (meta.type === 'subscription') {
      // Handle subscription payment
      if (isSuccess) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        await supabase.from('subscriptions').insert({
          user_id: meta.user_id,
          plan_id: meta.plan_id,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          cinetpay_transaction_id: transaction_id,
        })
      }
    } else {
      // Handle invoice payment
      const invoiceId = meta.invoice_id || transaction_id.match(/^INV-(.+)-\d+$/)?.[1]

      if (invoiceId && isSuccess) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            cinetpay_payment_id: transaction_id,
          })
          .eq('id', invoiceId)

        const { data: invoice } = await supabase
          .from('invoices')
          .select('user_id, total, currency')
          .eq('id', invoiceId)
          .single()

        if (invoice) {
          await supabase.from('payments').insert({
            invoice_id: invoiceId,
            user_id: invoice.user_id,
            amount: invoice.total,
            currency: invoice.currency,
            method: 'cinetpay',
            status: 'completed',
            cinetpay_transaction_id: transaction_id,
            metadata: body,
          })
        }
      } else if (invoiceId && isFailed) {
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('id', invoiceId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
