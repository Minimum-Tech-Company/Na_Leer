import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTransaction, getTransactionToken, FedaPayConfig } from '@/lib/fedapay'

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
      .select('*, client:clients(*)')
      .eq('id', id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (body.action === 'create_payment') {
      // Get the invoice owner's profile with FedaPay keys
      const { data: profile } = await supabase
        .from('profiles')
        .select('fedaipay_api_key, fedaipay_secret_key, fedaipay_environment, full_name, email')
        .eq('id', invoice.user_id)
        .single()

      if (!profile?.fedaipay_secret_key) {
        return NextResponse.json(
          { error: 'Le propriétaire de cette facture n\'a pas configuré de moyen de paiement. Contactez-le pour configurer FedaPay.' },
          { status: 400 }
        )
      }

      const config: FedaPayConfig = {
        secretKey: profile.fedaipay_secret_key,
        environment: (profile.fedaipay_environment as 'sandbox' | 'live') || 'sandbox',
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.vercel.app'

      // Create FedaPay transaction
      const transaction = await createTransaction(config, {
        description: `Facture ${invoice.invoice_number}`,
        amount: invoice.total,
        currency: invoice.currency || 'XOF',
        callbackUrl: `${appUrl}/api/webhooks/fedapay`,
        customerEmail: invoice.client?.email || undefined,
        customerFirstname: invoice.client?.name?.split(' ')[0] || undefined,
        customerLastname: invoice.client?.name?.split(' ').slice(1).join(' ') || undefined,
        metadata: {
          type: 'invoice',
          invoice_id: id,
          invoice_number: invoice.invoice_number,
          owner_id: invoice.user_id,
        },
      })

      // Get payment link
      const tokenData = await getTransactionToken(config, transaction.id)

      return NextResponse.json({
        transaction_id: transaction.id,
        payment_url: tokenData.url,
        reference: transaction.reference,
      })
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (error: any) {
    console.error('Invoice payment error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
