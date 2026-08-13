import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createPaymentAttempt } from '@/lib/dexchange'

export async function POST(request: NextRequest) {
  try {
    const { plan_id, amount, customer_name, customer_email, phone } = await request.json()

    if (!plan_id || !amount || !phone) {
      return NextResponse.json({ error: 'Paramètres manquants: plan_id, amount, phone requis' }, { status: 400 })
    }

    let userId = 'guest'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
    }

    let formattedPhone = phone.replace(/\s/g, '')
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1)
    }
    if (!formattedPhone.startsWith('221')) {
      formattedPhone = `221${formattedPhone}`
    }

    const reference = `SUB-${userId.substring(0, 8)}-${plan_id}-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.vercel.app'

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
        user_id: userId,
        plan_id,
      },
    })

    const attempt = await createPaymentAttempt({
      reference,
      operator: 'wave',
      countryISO: 'SN',
      customer: {
        name: customer_name || 'Client NA-Leer',
        phone: formattedPhone,
        email: customer_email || '',
      },
    })

    return NextResponse.json({
      session_id: session.id,
      payment_url: attempt.payment_url,
      status_token: attempt.status_token || null,
      reference,
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
