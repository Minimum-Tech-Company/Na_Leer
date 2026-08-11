import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Get invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (body.action === 'create_payment') {
      // Create CinetPay payment
      const response = await fetch('https://api.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_MERCHANT_ID,
          transaction_id: `INV-${id}-${Date.now()}`,
          amount: invoice.total,
          currency: invoice.currency,
          description: `Facture ${invoice.invoice_number}`,
          notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cinetpay`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${id}`,
          metadata: JSON.stringify({
            invoice_id: id,
            invoice_number: invoice.invoice_number,
          }),
        }),
      })

      if (!response.ok) {
        return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
      }

      const data = await response.json()

      if (data.code === 201 && data.data?.payment_url) {
        return NextResponse.json({ payment_url: data.data.payment_url })
      }

      return NextResponse.json({ error: 'Invalid response from CinetPay' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Invoice API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
