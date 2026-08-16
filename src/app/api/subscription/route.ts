import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/dexchange'

export async function POST(request: NextRequest) {
  try {
    const { plan_id, customer_name, customer_email } = await request.json()

    if (!plan_id) {
      return NextResponse.json({ error: 'Paramètre manquant: plan_id requis' }, { status: 400 })
    }

    let userId = 'guest'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
    }

    const { data: plan } = await supabase
      .from('plans')
      .select('price_xof, name')
      .eq('id', plan_id)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const amount = plan.price_xof

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.vercel.app'
    const reference = `SUB-${plan_id}-${Date.now()}`

    const session = await createCheckoutSession({
      reference,
      itemName: `Abonnement NA-Leer - Plan ${plan_id}`,
      amount,
      currency: 'XOF',
      successUrl: `${appUrl}/pricing?success=true`,
      failureUrl: `${appUrl}/pricing?failed=true`,
      webhookUrl: `${appUrl}/api/webhooks/dexchange`,
      metadata: {
        type: 'subscription',
        user_id: userId,
        plan_id,
      },
    })

    return NextResponse.json({
      session_id: session.id,
      payment_url: session.payment_url,
      reference,
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
