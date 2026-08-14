import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTransaction, getTransactionToken, FedaPayConfig } from '@/lib/fedapay'

export async function POST(request: NextRequest) {
  try {
    const { plan_id, amount, customer_name, customer_email } = await request.json()

    if (!plan_id || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants: plan_id, amount requis' }, { status: 400 })
    }

    // Get platform FedaPay keys from env
    const secretKey = process.env.FEDAPAY_SECRET_KEY
    const environment = (process.env.FEDAPAY_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox'

    if (!secretKey) {
      return NextResponse.json({ error: 'Clé API FedaPay non configurée sur le serveur' }, { status: 500 })
    }

    let userId = 'guest'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
    }

    const config: FedaPayConfig = { secretKey, environment }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.vercel.app'

    const transaction = await createTransaction(config, {
      description: `Abonnement NA-Leer - Plan ${plan_id}`,
      amount,
      currency: 'XOF',
      callbackUrl: `${appUrl}/api/webhooks/fedapay`,
      customerEmail: customer_email || undefined,
      customerFirstname: customer_name?.split(' ')[0] || undefined,
      customerLastname: customer_name?.split(' ').slice(1).join(' ') || undefined,
      metadata: {
        type: 'subscription',
        user_id: userId,
        plan_id,
      },
    })

    const tokenData = await getTransactionToken(config, transaction.id)

    return NextResponse.json({
      transaction_id: transaction.id,
      payment_url: tokenData.url,
      reference: transaction.reference,
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
