import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/fedapay'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const rawBody = await request.text()
    const signature = request.headers.get('x-fedapay-signature') || ''

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET
    if (webhookSecret) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid FedaPay webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)
    console.log('FedaPay webhook received:', JSON.stringify(body))

    const eventName = body.name
    const transaction = body.object?.data || body.data

    if (!transaction) {
      console.log('No transaction data in webhook')
      return NextResponse.json({ received: true })
    }

    // Extract metadata
    const metadata = transaction.custom_metadata || transaction.metadata || {}

    if (eventName === 'transaction.approved') {
      if (metadata.type === 'invoice') {
        const invoiceId = metadata.invoice_id

        if (invoiceId) {
          // Extract payment method from FedaPay transaction
          const paymentMethod = transaction.payment_method || transaction.method || 'fedapay'

          // Mark invoice as paid with payment method
          const { error } = await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              dexchange_payment_id: String(transaction.id),
              payment_method: paymentMethod,
            })
            .eq('id', invoiceId)

          if (error) {
            console.error('Error updating invoice:', error)
          } else {
            console.log(`Invoice ${invoiceId} marked as paid via ${paymentMethod}`)
          }

          // Record payment
          await supabase.from('payments').insert({
            invoice_id: invoiceId,
            user_id: metadata.owner_id || '',
            amount: transaction.amount,
            currency: transaction.currency?.iso || 'XOF',
            method: paymentMethod,
            status: 'completed',
            dexchange_payment_id: String(transaction.id),
            metadata: metadata,
          })
        }
      }

      if (metadata.type === 'subscription') {
        const userId = metadata.user_id
        const planId = metadata.plan_id

        if (userId && planId) {
          // Create or update subscription
          const expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)

          const { error } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_id: planId,
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              dexchange_payment_id: String(transaction.id),
            })

          if (error) {
            console.error('Error creating subscription:', error)
          } else {
            console.log(`Subscription created for user ${userId}, plan ${planId}`)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('FedaPay webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
