import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/dexchange'

const PAYMENT_METHODS: Record<string, string> = {
  orange: 'orange_money',
  wave: 'wave',
  free: 'mobile_money',
  wizall: 'mobile_money',
}

export async function POST(request: NextRequest) {
  try {
    const { plan_id, phone, provider } = await request.json()

    if (!plan_id || !provider) {
      return NextResponse.json({ error: 'Paramètres manquants: plan_id et provider requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }

    const { data: plan } = await supabase
      .from('plans')
      .select('price_xof, name')
      .eq('id', plan_id)
      .single()

    if (!plan || plan.price_xof === 0) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const reference = `SUB-${plan_id}-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.org'

    await supabase.from('pending_subscriptions').insert({
      user_id: user.id,
      reference,
      plan_id,
      amount_xof: plan.price_xof,
      provider,
      phone: phone || null,
    })

    const paymentMethod = PAYMENT_METHODS[provider] || 'card'

    const session = await createCheckoutSession({
      reference,
      itemName: `Abonnement NA-Leer - Plan ${plan.name}`,
      amount: plan.price_xof,
      currency: 'XOF',
      successUrl: `${appUrl}/pricing?success=true`,
      failureUrl: `${appUrl}/pricing?failed=true`,
      webhookUrl: `${appUrl}/api/webhooks/dexchange`,
      paymentMethod,
      phone: provider !== 'card' ? phone : undefined,
      metadata: {
        type: 'subscription',
        user_id: user.id,
        plan_id,
      },
    })

    return NextResponse.json({
      success: true,
      payment_url: session.payment_url,
      message: provider === 'card'
        ? 'Redirection vers la page de paiement...'
        : 'Redirection vers la page de paiement mobile...',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Direct payment error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
