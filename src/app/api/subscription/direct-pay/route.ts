import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEXCHANGE_API_URL = 'https://api-m.dexchange.sn/api/v1'

const SERVICE_CODES: Record<string, string> = {
  'orange': 'OM_SN_CASHOUT',
  'wave': 'WAVE_SN_CASHOUT',
  'free': 'FM_SN_CASHOUT',
}

export async function POST(request: NextRequest) {
  try {
    const { plan_id, phone, provider } = await request.json()

    if (!plan_id || !phone || !provider) {
      return NextResponse.json({ error: 'Paramètres manquants: plan_id, phone, provider requis' }, { status: 400 })
    }

    const serviceCode = SERVICE_CODES[provider]
    if (!serviceCode) {
      return NextResponse.json({ error: 'Fournisseur de paiement invalide' }, { status: 400 })
    }

    const phoneClean = phone.replace(/\s/g, '').replace(/^221/, '')
    if (!/^[0-9]{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide (9 chiffres requis)' }, { status: 400 })
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

    const apiKey = process.env.DEXCHANGE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const reference = `SUB-${plan_id}-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.org'

    await supabase.from('pending_subscriptions').insert({
      user_id: user.id,
      reference,
      plan_id,
      amount_xof: plan.price_xof,
      provider,
      phone: phoneClean,
    })

    const response = await fetch(`${DEXCHANGE_API_URL}/transaction/init`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalTransactionId: reference,
        serviceCode,
        amount: plan.price_xof,
        number: phoneClean,
        callBackURL: `${appUrl}/api/webhooks/dexchange`,
        successUrl: `${appUrl}/pricing?success=true`,
        failureUrl: `${appUrl}/pricing?failed=true`,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      await supabase.from('pending_subscriptions').delete().eq('reference', reference)
      return NextResponse.json(
        { error: data.message || 'Erreur lors de l\'initialisation du paiement' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction_id: data.transaction?.transactionId,
      status: data.transaction?.Status,
      message: 'Demande de paiement envoyée. Confirmez sur votre téléphone.',
    })
  } catch (error: any) {
    console.error('Direct payment error:', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
