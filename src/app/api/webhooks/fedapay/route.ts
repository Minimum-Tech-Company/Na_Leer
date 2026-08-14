import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

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
          // Mark invoice as paid
          const { error } = await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              dexchange_payment_id: String(transaction.id),
            })
            .eq('id', invoiceId)

          if (error) {
            console.error('Error updating invoice:', error)
          } else {
            console.log(`Invoice ${invoiceId} marked as paid`)
          }

          // Record payment
          await supabase.from('payments').insert({
            invoice_id: invoiceId,
            user_id: metadata.owner_id || '',
            amount: transaction.amount,
            currency: transaction.currency?.iso || 'XOF',
            method: 'fedapay',
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
