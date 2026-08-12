import { createClient } from '@/lib/supabase/client'
import { Plan, Subscription } from '@/types'

export async function getCurrentSubscription(userId: string): Promise<{ plan: Plan; subscription: Subscription } | null> {
  const supabase = createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    const { data: freePlan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', 'free')
      .single()

    if (freePlan) {
      return { plan: freePlan, subscription: null as any }
    }
    return null
  }

  return {
    plan: subscription.plan as Plan,
    subscription,
  }
}

export async function canCreateInvoice(userId: string): Promise<{ allowed: boolean; reason?: string; current: number; max: number }> {
  const supabase = createClient()
  const sub = await getCurrentSubscription(userId)

  if (!sub) {
    return { allowed: false, reason: 'Aucun plan trouvé', current: 0, max: 0 }
  }

  if (sub.plan.max_invoices === -1) {
    return { allowed: true, current: 0, max: -1 }
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const current = count || 0
  const max = sub.plan.max_invoices

  if (current >= max) {
    return {
      allowed: false,
      reason: `Vous avez atteint la limite de ${max} factures/mois. Passez au plan Pro pour factures illimitées.`,
      current,
      max,
    }
  }

  return { allowed: true, current, max }
}

export async function canCreateClient(userId: string): Promise<{ allowed: boolean; reason?: string; current: number; max: number }> {
  const supabase = createClient()
  const sub = await getCurrentSubscription(userId)

  if (!sub) {
    return { allowed: false, reason: 'Aucun plan trouvé', current: 0, max: 0 }
  }

  if (sub.plan.max_clients === -1) {
    return { allowed: true, current: 0, max: -1 }
  }

  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const current = count || 0
  const max = sub.plan.max_clients

  if (current >= max) {
    return {
      allowed: false,
      reason: `Vous avez atteint la limite de ${max} clients. Passez au plan Pro pour clients illimités.`,
      current,
      max,
    }
  }

  return { allowed: true, current, max }
}
