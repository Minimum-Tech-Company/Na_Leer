import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/dexchange'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    const signature = request.headers.get('x-dexchange-signature') || ''
    const rawBody = JSON.stringify(body)

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const supabase = await createClient()

    if (type === 'checkout.completed') {
      const reference = data?.reference || data?.metadata?.reference

      if (reference && reference.startsWith('SUB-')) {
        const parts = reference.split('-')
        const userId = parts[1]
        const planId = parts[2]

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          dexchange_transaction_id: data?.id || reference,
        })
      } else if (reference && reference.startsWith('INV-')) {
        const invoiceId = reference.split('-')[1]

        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            dexchange_payment_id: data?.id || reference,
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
            method: 'dexchange',
            status: 'completed',
            dexchange_transaction_id: data?.id || reference,
            metadata: body,
          })
        }
      }
    } else if (type === 'checkout.failed') {
      const reference = data?.reference || data?.metadata?.reference

      if (reference && reference.startsWith('INV-')) {
        const invoiceId = reference.split('-')[1]
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('id', invoiceId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
