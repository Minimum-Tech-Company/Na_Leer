import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { plan_id, amount, customer_name, customer_email } = await request.json()

    if (!plan_id || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const transaction_id = `SUB-${user.id.substring(0, 8)}-${plan_id}-${Date.now()}`

    const response = await fetch('https://api.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_MERCHANT_ID,
        transaction_id,
        amount,
        currency: 'XOF',
        description: `Abonnement NA-Leer - Plan ${plan_id}`,
        customer_name,
        customer_email,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cinetpay`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
        metadata: JSON.stringify({
          type: 'subscription',
          user_id: user.id,
          plan_id,
        }),
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Erreur CinetPay' }, { status: 500 })
    }

    const data = await response.json()

    if (data.code === 201 && data.data?.payment_url) {
      return NextResponse.json({ payment_url: data.data.payment_url })
    }

    return NextResponse.json({ error: 'Réponse invalide de CinetPay' }, { status: 500 })
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
