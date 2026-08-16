import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/dexchange'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    const { event, data } = body

    const signature = request.headers.get('x-dexchange-signature') || ''

    const secret = process.env.DEXCHANGE_WEBHOOK_SECRET
    if (secret) {
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.error('Invalid Dexchange webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const supabase = await createClient()

    if (event === 'checkout.completed') {
      const reference = data?.reference || ''
      const metadata = data?.metadata || {}

      // Handle subscription payments
      if (metadata.type === 'subscription' || reference.startsWith('SUB-')) {
        const userId = metadata.user_id
        const planId = metadata.plan_id

        if (!userId || !planId) {
          console.error('Missing user_id or plan_id in subscription metadata')
          return NextResponse.json({ received: true })
        }

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          dexchange_transaction_id: data?.transaction_id || reference,
        })

        console.log(`Subscription created for user ${userId}, plan ${planId}`)
      }
      // Handle invoice payments
      else if (metadata.type === 'invoice' || reference.startsWith('INV-')) {
        const invoiceId = metadata.invoice_id

        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              dexchange_payment_id: data?.transaction_id || reference,
              payment_method: data?.operator || 'dexchange',
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
              method: data?.operator || 'dexchange',
              status: 'completed',
              dexchange_transaction_id: data?.transaction_id || reference,
              metadata: metadata,
            })
          }

          console.log(`Invoice ${invoiceId} marked as paid`)
        }
      }
    } else if (event === 'checkout.failed') {
      const reference = data?.reference || ''
      const metadata = data?.metadata || {}

      if (metadata.type === 'invoice' || reference.startsWith('INV-')) {
        const invoiceId = metadata.invoice_id
        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('id', invoiceId)
          console.log(`Invoice ${invoiceId} marked as overdue`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
