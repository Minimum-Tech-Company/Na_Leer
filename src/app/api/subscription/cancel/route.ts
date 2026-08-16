import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { subscription_id } = await request.json()

    if (!subscription_id) {
      return NextResponse.json({ error: 'ID d\'abonnement requis' }, { status: 400 })
    }

    const { data: sub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('id', subscription_id)
      .single()

    if (fetchError || !sub) {
      return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 })
    }

    if (sub.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (sub.status !== 'active') {
      return NextResponse.json({ error: 'Cet abonnement n\'est pas actif' }, { status: 400 })
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscription_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
