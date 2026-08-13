import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/dexchange'

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

    console.log('Subscription API: Creating session with reference:', reference, 'amount:', amount, 'phone:', formattedPhone)

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
        phone: formattedPhone,
      },
    })

    console.log('Subscription API: Session created:', JSON.stringify(session))

    return NextResponse.json({
      session_id: session.reference || reference,
      payment_url: session.payment_url,
      reference,
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
