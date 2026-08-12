import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createPaymentAttempt } from '@/lib/dexchange'

export async function POST(request: NextRequest) {
  try {
    const { plan_id, amount, customer_name, customer_email, phone } = await request.json()

    if (!plan_id || !amount || !phone) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const reference = `SUB-${user.id.substring(0, 8)}-${plan_id}-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await createCheckoutSession({
      reference,
      itemName: `Abonnement NA-Leer - Plan ${plan_id}`,
      amount,
      currency: 'XOF',
      successUrl: `${appUrl}/pricing?success=true`,
      failureUrl: `${appUrl}/pricing?cancelled=true`,
      webhookUrl: `${appUrl}/api/webhooks/dexchange`,
      metadata: {
        type: 'subscription',
        user_id: user.id,
        plan_id,
      },
    })

    const attempt = await createPaymentAttempt({
      reference,
      operator: 'wave',
      countryISO: 'SN',
      customer: {
        name: customer_name || user.email,
        phone,
        email: customer_email || user.email,
      },
    })

    return NextResponse.json({
      session_id: session.id,
      payment_url: attempt.payment_url,
      reference,
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
