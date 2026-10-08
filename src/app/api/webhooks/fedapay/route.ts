import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/encryption'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data = formData.get('data') as string

    if (!data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const decrypted = JSON.parse(decrypt(data))
    const txStatus = decrypted.status

    const supabase = createAdminClient()

    if (txStatus === 'approved') {
      const reference = decrypted.tx_ref || decrypted.reference
      const metadata = decrypted.metadata || {}

      if (metadata.type === 'invoice' || reference?.startsWith('INV-')) {
        const invoiceId = metadata.invoice_id

        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: 'mobile_money',
              payment_source: 'fedapay',
              payment_status: 'paid',
              dexchange_payment_id: reference,
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
              method: 'mobile_money',
              status: 'completed',
              dexchange_transaction_id: reference,
              metadata: metadata,
            })
          }
        }
      } else if (metadata.type === 'subscription' || reference?.startsWith('SUB-')) {
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
          dexchange_transaction_id: reference,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('FedaPay webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
