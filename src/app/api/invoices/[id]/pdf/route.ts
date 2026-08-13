import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createPaymentAttempt } from '@/lib/dexchange'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (body.action === 'create_payment') {
      const { phone } = body

      if (!phone) {
        return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
      }

      const reference = `INV-${id}-${Date.now()}`
      const formattedPhone = phone.startsWith('221') ? phone : `221${phone}`
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.vercel.app'

      const session = await createCheckoutSession({
        reference,
        itemName: `Facture ${invoice.invoice_number}`,
        amount: invoice.total,
        currency: invoice.currency || 'XOF',
        successUrl: `${appUrl}/invoices/${id}?paid=true`,
        failureUrl: `${appUrl}/invoices/${id}?payment=failed`,
        webhookUrl: `${appUrl}/api/webhooks/dexchange`,
        metadata: {
          type: 'invoice',
          invoice_id: id,
          invoice_number: invoice.invoice_number,
        },
      })

      const attempt = await createPaymentAttempt({
        reference,
        operator: 'wave',
        countryISO: 'SN',
        customer: {
          phone: formattedPhone,
        },
      })

      return NextResponse.json({
        session_id: session.id,
        payment_url: attempt.payment_url,
        reference,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Invoice API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
