import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook signature from CinetPay
    // In production, verify the HMAC signature
    const { transaction_id, status, metadata } = body

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get invoice from metadata
    let invoiceId: string | null = null
    if (metadata) {
      try {
        const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
        invoiceId = meta.invoice_id
      } catch {
        // Try to extract from transaction_id format: INV-{id}-{timestamp}
        const match = transaction_id.match(/^INV-(.+)-\d+$/)
        if (match) {
          invoiceId = match[1]
        }
      }
    }

    if (!invoiceId) {
      return NextResponse.json({ error: 'Could not determine invoice_id' }, { status: 400 })
    }

    // Update invoice status
    if (status === 'SUCCESS' || status === 'ACCEPTED') {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          cinetpay_payment_id: transaction_id,
        })
        .eq('id', invoiceId)

      // Create payment record
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
    } else if (status === 'REFUSED' || status === 'CANCELED') {
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoiceId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
