import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSubscriptionExpiryEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!subscription) {
      return NextResponse.json({ active: false })
    }

    const expiresAt = new Date(subscription.expires_at)
    const now = new Date()
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft > 7 || daysLeft < -30) {
      return NextResponse.json({ active: true, daysLeft, reminderSent: false })
    }

    const lastReminder = subscription.last_reminder_sent_at
      ? new Date(subscription.last_reminder_sent_at)
      : null
    const hoursSinceLastReminder = lastReminder
      ? (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60)
      : Infinity

    if (hoursSinceLastReminder < 24) {
      return NextResponse.json({ active: true, daysLeft, reminderSent: true })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, company_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ active: true, daysLeft, reminderSent: false, error: 'Pas d\'email' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.org'
    const planName = (subscription.plan as any)?.name || 'Pro'

    const result = await sendSubscriptionExpiryEmail({
      to: profile.email,
      planName,
      daysLeft,
      renewalUrl: `${appUrl}/pricing`,
      companyName: profile.company_name || planName,
    })

    if (result.success) {
      await supabase
        .from('subscriptions')
        .update({ last_reminder_sent_at: now.toISOString() })
        .eq('id', subscription.id)
    }

    return NextResponse.json({
      active: true,
      daysLeft,
      reminderSent: result.success,
      expires_at: subscription.expires_at,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Check expiry error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
